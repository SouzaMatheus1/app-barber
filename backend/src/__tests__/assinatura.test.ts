import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

jest.mock('../database/prisma', () => {
  return {
    prisma: {
      plano: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      assinatura: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      transacao: {
        create: jest.fn(),
      },
    },
  };
});

describe('Assinatura API', () => {
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

  describe('GET /planos', () => {
    it('deve listar os planos', async () => {
      const mockPlanos = [{ id: 1, nome: 'Plano Básico', valorMensal: 50 }];

      (prisma.plano.findMany as jest.Mock).mockResolvedValueOnce(mockPlanos);

      const res = await request(app)
        .get('/planos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.plano.findMany).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveLength(1);
    });

    it('deve retornar erro 500 caso o serviço falhe ao listar planos', async () => {
      (prisma.plano.findMany as jest.Mock).mockRejectedValueOnce(new Error('Erro BD'));

      const res = await request(app)
        .get('/planos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro BD');
    });
  });

  describe('POST /planos', () => {
    it('deve criar um plano', async () => {
      const novoPlano = { id: 2, nome: 'Plano Pro', valorMensal: 100 };

      (prisma.plano.create as jest.Mock).mockResolvedValueOnce(novoPlano);

      const res = await request(app)
        .post('/planos')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Plano Pro', valorMensal: 100, itens: [{ itemId: 1, quantidade: 1 }] });

      expect(res.status).toBe(201);
      expect(prisma.plano.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se a criação falhar', async () => {
      (prisma.plano.create as jest.Mock).mockRejectedValueOnce(new Error('Dados inválidos'));

      const res = await request(app)
        .post('/planos')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Plano Pro', valorMensal: 100, itens: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dados inválidos');
    });
  });

  describe('PUT /planos/:id', () => {
    it('deve editar um plano com sucesso', async () => {
      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'Plano Básico' });
      (prisma.plano.update as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'Plano Editado' });

      const res = await request(app)
        .put('/planos/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Plano Editado' });

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Plano Editado');
    });

    it('deve retornar 400 se o plano não existir ao editar', async () => {
      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/planos/99')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Inexistente' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Plano não encontrado');
    });
  });

  describe('DELETE /planos/:id', () => {
    it('deve desativar um plano com sucesso', async () => {
      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, ativo: true });
      (prisma.plano.update as jest.Mock).mockResolvedValueOnce({ id: 1, ativo: false });

      const res = await request(app)
        .delete('/planos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Plano desativado com sucesso');
    });

    it('deve retornar erro 400 se o plano não for encontrado ao deletar', async () => {
      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/planos/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Plano não encontrado');
    });
  });

  describe('GET /assinaturas', () => {
    it('deve listar assinaturas', async () => {
      const mockAssinaturas = [{ id: 1, clienteId: 1, planoId: 1 }];

      (prisma.assinatura.findMany as jest.Mock).mockResolvedValueOnce(mockAssinaturas);

      const res = await request(app)
        .get('/assinaturas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.assinatura.findMany).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 500 se falhar ao listar assinaturas', async () => {
      (prisma.assinatura.findMany as jest.Mock).mockRejectedValueOnce(new Error('Erro listagem'));

      const res = await request(app)
        .get('/assinaturas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro listagem');
    });
  });

  describe('POST /assinaturas', () => {
    it('deve retornar erro 400 se faltarem parâmetros obrigatórios', async () => {
      const res = await request(app)
        .post('/assinaturas')
        .set('Authorization', `Bearer ${token}`)
        .send({ clienteId: 1 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Faltam parâmetros obrigatórios.');
    });

    it('deve assinar um plano com sucesso (criando pagamento e inativando assinatura antiga)', async () => {
      const mockPlano = { id: 1, nome: 'Plano Pro', valorMensal: 100, frequencia: 'MENSAL', itens: [] };
      const mockAssinaturaAtiva = { id: 10, clienteId: 1, status: 'ATIVA' };
      const mockNovaAssinatura = { id: 11, clienteId: 1, planoId: 1, status: 'ATIVA', creditos: [] };

      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce(mockPlano);
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinaturaAtiva);
      (prisma.assinatura.update as jest.Mock).mockResolvedValueOnce({ id: 10, status: 'INATIVA' });
      (prisma.assinatura.create as jest.Mock).mockResolvedValueOnce(mockNovaAssinatura);
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce({});

      const res = await request(app)
        .post('/assinaturas')
        .set('Authorization', `Bearer ${token}`)
        .send({ clienteId: 1, planoId: 1, profissionalIdParaTransacao: 2 });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(11);
      expect(prisma.assinatura.update).toHaveBeenCalledTimes(1);
      expect(prisma.transacao.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se o plano não existir', async () => {
      (prisma.plano.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/assinaturas')
        .set('Authorization', `Bearer ${token}`)
        .send({ clienteId: 1, planoId: 99, profissionalIdParaTransacao: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Plano não encontrado');
    });
  });

  describe('PATCH /assinaturas/:id/renovar', () => {
    it('deve retornar erro 400 se profissionalIdParaTransacao não for informado', async () => {
      const res = await request(app)
        .patch('/assinaturas/1/renovar')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('profissionalIdParaTransacao é obrigatório.');
    });

    it('deve renovar a assinatura com sucesso', async () => {
      const mockAssinatura = {
        id: 1,
        status: 'ATIVA',
        clienteId: 5,
        dataProximoVencimento: new Date(Date.now() + 86400000), // Vence amanhã
        plano: {
          valorMensal: 80,
          frequencia: 'MENSAL',
          itens: []
        }
      };

      (prisma.assinatura.findUnique as jest.Mock).mockResolvedValueOnce(mockAssinatura);
      (prisma.assinatura.update as jest.Mock).mockResolvedValueOnce({ id: 1, status: 'ATIVA' });
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce({});

      const res = await request(app)
        .patch('/assinaturas/1/renovar')
        .set('Authorization', `Bearer ${token}`)
        .send({ profissionalIdParaTransacao: 2 });

      expect(res.status).toBe(200);
      expect(prisma.assinatura.update).toHaveBeenCalledTimes(1);
      expect(prisma.transacao.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se assinatura não existir', async () => {
      (prisma.assinatura.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .patch('/assinaturas/99/renovar')
        .set('Authorization', `Bearer ${token}`)
        .send({ profissionalIdParaTransacao: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Assinatura não encontrada');
    });
  });

  describe('GET /assinaturas/cliente/:clienteId/ativa', () => {
    it('deve buscar assinatura ativa do cliente', async () => {
      const mockAssinatura = {
        id: 1,
        clienteId: 5,
        status: 'ATIVA',
        plano: {
          valorMensal: 80,
          itens: []
        },
        creditos: []
      };

      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinatura);

      const res = await request(app)
        .get('/assinaturas/cliente/5/ativa')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.valorProporcional).toBe(0);
    });

    it('deve retornar null se cliente não tiver assinatura ativa', async () => {
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/assinaturas/cliente/5/ativa')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  describe('GET /portal/minha-assinatura', () => {
    it('deve retornar 403 se o perfil do usuário não for CLIENTE ou isPortal', async () => {
      const res = await request(app)
        .get('/portal/minha-assinatura')
        .set('Authorization', `Bearer ${token}`); // Perfil ADMIN

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Acesso negado. Apenas clientes do portal.');
    });

    it('deve retornar assinatura ativa para o cliente autenticado do portal', async () => {
      const portalToken = jwt.sign(
        { id: 10, perfil: 'CLIENTE', isPortal: true, empresaId: 1 },
        process.env.JWT_SECRET as string
      );

      const mockAssinatura = {
        id: 2,
        clienteId: 10,
        status: 'ATIVA',
        plano: {
          valorMensal: 120,
          itens: [{ itemId: 1, quantidade: 4 }]
        },
        creditos: []
      };

      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinatura);

      const res = await request(app)
        .get('/portal/minha-assinatura')
        .set('Authorization', `Bearer ${portalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(2);
      expect(res.body.valorProporcional).toBe(30); // 120 / 4 = 30
    });
  });
});
