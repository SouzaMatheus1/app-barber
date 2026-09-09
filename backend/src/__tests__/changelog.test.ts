import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

jest.mock('../database/prisma', () => {
  const mockPrisma = {
    empresa: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    changelogEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    systemPrisma: mockPrisma,
  };
});

describe('Changelog API', () => {
  let tokenTenant: string;
  let tokenTenantAdmin: string;
  let tokenPlatformAdmin: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
    process.env.PLATFORM_EMPRESA_ID = '1';

    // Tenant comum (barbearia), empresaId 2 (BARBEARIA)
    tokenTenant = jwt.sign(
      { id: 10, perfil: 'PROFISSIONAL', empresaId: 2 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Admin do próprio tenant (não é admin de plataforma)
    tokenTenantAdmin = jwt.sign(
      { id: 11, perfil: 'ADMIN', empresaId: 2 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Admin da plataforma: empresaId igual ao PLATFORM_EMPRESA_ID
    tokenPlatformAdmin = jwt.sign(
      { id: 1, perfil: 'ADMIN', empresaId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /changelog (listarParaTenant)', () => {
    it('retorna apenas entradas do segmento do tenant e as globais (tipoEmpresaId nulo)', async () => {
      const mockEmpresa = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: null };
      const mockEntradas = [
        { id: 1, titulo: 'Global', descricao: 'Para todos', tipoEmpresaId: null, publicadoEm: new Date('2026-08-20') },
        { id: 2, titulo: 'Barbearia', descricao: 'Só barbearia', tipoEmpresaId: 2, publicadoEm: new Date('2026-08-25') },
      ];

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.changelogEntry.findMany as jest.Mock).mockImplementationOnce(({ where }) => {
        // Simula o filtro do banco: só devolve entradas cujo tipoEmpresaId é nulo ou bate com o tenant.
        return Promise.resolve(mockEntradas.filter(e => e.tipoEmpresaId === null || e.tipoEmpresaId === where.OR[1].tipoEmpresaId));
      });

      const res = await request(app)
        .get('/changelog')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((e: any) => e.id)).toEqual(expect.arrayContaining([1, 2]));
    });

    it('não retorna entrada de outro segmento', async () => {
      const mockEmpresa = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: null };
      const mockEntradas = [
        { id: 3, titulo: 'Pet shop', descricao: 'Só pet shop', tipoEmpresaId: 3, publicadoEm: new Date('2026-08-25') },
      ];

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.changelogEntry.findMany as jest.Mock).mockImplementationOnce(({ where }) => {
        return Promise.resolve(mockEntradas.filter(e => e.tipoEmpresaId === null || e.tipoEmpresaId === where.OR[1].tipoEmpresaId));
      });

      const res = await request(app)
        .get('/changelog')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /changelog/nao-lidas (contarNaoLidas)', () => {
    it('conta todas as entradas relevantes como não lidas quando changelogVisualizadoEm é null', async () => {
      const mockEmpresa = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: null };
      const mockEntradas = [
        { id: 1, tipoEmpresaId: null, publicadoEm: new Date('2026-08-20') },
        { id: 2, tipoEmpresaId: 2, publicadoEm: new Date('2026-08-25') },
      ];

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.changelogEntry.findMany as jest.Mock).mockResolvedValueOnce(mockEntradas);

      const res = await request(app)
        .get('/changelog/nao-lidas')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it('conta apenas entradas publicadas após changelogVisualizadoEm', async () => {
      const mockEmpresa = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: new Date('2026-08-22') };
      const mockEntradas = [
        { id: 1, tipoEmpresaId: null, publicadoEm: new Date('2026-08-20') }, // antes -> lida
        { id: 2, tipoEmpresaId: 2, publicadoEm: new Date('2026-08-25') },   // depois -> não lida
      ];

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.changelogEntry.findMany as jest.Mock).mockResolvedValueOnce(mockEntradas);

      const res = await request(app)
        .get('/changelog/nao-lidas')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it('zera a contagem após marcarComoVisualizado', async () => {
      const mockEmpresa = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: null };

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.empresa.update as jest.Mock).mockResolvedValueOnce({ ...mockEmpresa, changelogVisualizadoEm: new Date() });

      const resMarcar = await request(app)
        .post('/changelog/marcar-visualizado')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(resMarcar.status).toBe(200);
      expect(prisma.empresa.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { changelogVisualizadoEm: expect.any(Date) }
      });

      const empresaAposVisualizar = { id: 2, tipoEmpresaId: 2, changelogVisualizadoEm: new Date('2026-08-29') };
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(empresaAposVisualizar);
      (prisma.changelogEntry.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 1, tipoEmpresaId: null, publicadoEm: new Date('2026-08-20') }
      ]);

      const resContar = await request(app)
        .get('/changelog/nao-lidas')
        .set('Authorization', `Bearer ${tokenTenant}`);

      expect(resContar.status).toBe(200);
      expect(resContar.body.total).toBe(0);
    });
  });

  describe('POST /admin/changelog (proteção de plataforma)', () => {
    it('recusa um tenant comum (perfil PROFISSIONAL)', async () => {
      const res = await request(app)
        .post('/admin/changelog')
        .set('Authorization', `Bearer ${tokenTenant}`)
        .send({ titulo: 'Novidade', descricao: 'Descrição' });

      expect(res.status).toBe(403);
      expect(prisma.changelogEntry.create).not.toHaveBeenCalled();
    });

    it('recusa o admin de um tenant comum (perfil ADMIN, mas não é a plataforma)', async () => {
      const res = await request(app)
        .post('/admin/changelog')
        .set('Authorization', `Bearer ${tokenTenantAdmin}`)
        .send({ titulo: 'Novidade', descricao: 'Descrição' });

      expect(res.status).toBe(403);
      expect(prisma.changelogEntry.create).not.toHaveBeenCalled();
    });

    it('permite a administração da plataforma criar uma entrada', async () => {
      const mockEntrada = { id: 1, titulo: 'Novidade', descricao: 'Descrição', tipoEmpresaId: null };
      (prisma.changelogEntry.create as jest.Mock).mockResolvedValueOnce(mockEntrada);

      const res = await request(app)
        .post('/admin/changelog')
        .set('Authorization', `Bearer ${tokenPlatformAdmin}`)
        .send({ titulo: 'Novidade', descricao: 'Descrição' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockEntrada);
    });
  });
});
