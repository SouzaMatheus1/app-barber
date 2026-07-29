import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma, systemPrisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

jest.mock('../database/prisma', () => {
  return {
    systemPrisma: {
      empresa: {
        findUnique: jest.fn(),
      },
      temaPadrao: {
        findUnique: jest.fn(),
      },
    },
    prisma: {
      temaEmpresa: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    },
  };
});

describe('Tema API', () => {
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    token = jwt.sign(
      { id: 1, perfil: 'ADMIN', empresaId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /temas/empresa/:slug', () => {
    it('deve retornar tema padrão (fallback/segmento) se empresa existir e não tiver override', async () => {
      (systemPrisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        slug: 'minha-empresa',
        tipoEmpresaId: 1
      });

      (systemPrisma.temaPadrao.findUnique as jest.Mock).mockResolvedValueOnce({
        corPrimaria: '#C9A84C',
        corSecundaria: '#E2C175',
        corFundo: '#0A0A0A',
        corSuperficie: '#111111',
        corTexto: '#F5F5F5',
        logoUrl: null,
        faviconUrl: null
      });

      (prisma.temaEmpresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/temas/empresa/minha-empresa');

      expect(res.status).toBe(200);
      expect(res.body.corPrimaria).toBe('#C9A84C');
      expect(res.body.corSecundaria).toBe('#E2C175');
      expect(systemPrisma.empresa.findUnique).toHaveBeenCalledTimes(1);
      expect(systemPrisma.temaPadrao.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.temaEmpresa.findUnique).toHaveBeenCalledTimes(1);
    });

    it('deve retornar tema mesclado se empresa tiver override parcial', async () => {
      (systemPrisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        slug: 'minha-empresa',
        tipoEmpresaId: 1
      });

      (systemPrisma.temaPadrao.findUnique as jest.Mock).mockResolvedValueOnce({
        corPrimaria: '#C9A84C',
        corSecundaria: '#E2C175',
        corFundo: '#0A0A0A',
        corSuperficie: '#111111',
        corTexto: '#F5F5F5',
        logoUrl: null,
        faviconUrl: null
      });

      // Override de apenas corPrimaria
      (prisma.temaEmpresa.findUnique as jest.Mock).mockResolvedValueOnce({
        corPrimaria: '#FF0000',
        corSecundaria: null,
        corFundo: null,
        corSuperficie: null,
        corTexto: null,
        logoUrl: null,
        faviconUrl: null
      });

      const res = await request(app)
        .get('/temas/empresa/minha-empresa');

      expect(res.status).toBe(200);
      expect(res.body.corPrimaria).toBe('#FF0000'); // Customizado
      expect(res.body.corSecundaria).toBe('#E2C175'); // Fallback do segmento
      expect(res.body.corFundo).toBe('#0A0A0A'); // Fallback do segmento
    });

    it('deve retornar 404 se empresa não existir', async () => {
      (systemPrisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/temas/empresa/nao-existe');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Empresa não encontrada');
    });
  });

  describe('PUT /temas', () => {
    it('deve atualizar o tema da empresa e retornar 200', async () => {
      (prisma.temaEmpresa.upsert as jest.Mock).mockResolvedValueOnce({
        empresaId: 1,
        corPrimaria: '#FFFFFF',
        corSecundaria: null,
        corFundo: null,
        corSuperficie: null,
        corTexto: null,
        logoUrl: null,
        faviconUrl: null
      });

      const res = await request(app)
        .put('/temas')
        .set('Authorization', `Bearer ${token}`)
        .send({ corPrimaria: '#FFFFFF' });

      expect(res.status).toBe(200);
      expect(prisma.temaEmpresa.upsert).toHaveBeenCalledTimes(1);
      expect(res.body.corPrimaria).toBe('#FFFFFF');
    });
  });
});
