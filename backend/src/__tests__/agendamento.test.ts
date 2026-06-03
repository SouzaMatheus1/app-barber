import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

// Mocking o prisma client
jest.mock('../database/prisma', () => {
  const mockPrisma = {
    agendamento: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assinatura: {
      findFirst: jest.fn(),
    },
    creditoAssinatura: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    itemCatalogo: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve({});
    }),
  };
  return {
    prisma: mockPrisma,
    systemPrisma: mockPrisma,
  };
});

describe('Agendamento API', () => {
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

  describe('GET /agendamentos', () => {
    it('deve listar agendamentos', async () => {
      const mockAgendamentos = [
        {
          id: 1,
          dataHoraInicio: new Date(),
          dataHoraFim: new Date(),
          cliente: { id: 1, nome: 'João da Silva' },
          profissional: { id: 2, nome: 'Thiago Barbeiro' },
          servicos: []
        }
      ];

      (prisma.agendamento.findMany as jest.Mock).mockResolvedValueOnce(mockAgendamentos);

      const res = await request(app)
        .get('/agendamentos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(prisma.agendamento.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /agendamentos', () => {
    it('deve criar um novo agendamento com sucesso', async () => {
      const mockAgendamento = {
        id: 1,
        dataHoraInicio: new Date(Date.now() + 60 * 60000).toISOString(),
        dataHoraFim: new Date(Date.now() + 90 * 60000).toISOString(),
        clienteId: 1,
        profissionalId: 2,
        status: 'CONFIRMADO'
      };

      (prisma.agendamento.findFirst as jest.Mock).mockResolvedValueOnce(null); // Sem colisão
      (prisma.agendamento.create as jest.Mock).mockResolvedValueOnce(mockAgendamento);

      const res = await request(app)
        .post('/agendamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataHoraInicio: new Date(Date.now() + 60 * 60000).toISOString(),
          dataHoraFim: new Date(Date.now() + 90 * 60000).toISOString(),
          clienteId: 1,
          profissionalId: 2,
          servicosIds: [1]
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(prisma.agendamento.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 em caso de colisão de horário (overbooking)', async () => {
      (prisma.agendamento.findFirst as jest.Mock).mockResolvedValueOnce({ id: 99 }); // Colisão detectada

      const res = await request(app)
        .post('/agendamentos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dataHoraInicio: new Date(Date.now() + 60 * 60000).toISOString(),
          dataHoraFim: new Date(Date.now() + 90 * 60000).toISOString(),
          clienteId: 1,
          profissionalId: 2,
          servicosIds: [1]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Horário indisponível!');
    });
  });

  describe('PUT /agendamentos/:id/status', () => {
    it('deve alterar o status de um agendamento', async () => {
      const mockAgendamento = {
        id: 1,
        status: 'CONFIRMADO',
        observacao: '',
        clienteId: 1,
        empresaId: 1,
        servicos: []
      };

      (prisma.agendamento.findUnique as jest.Mock).mockResolvedValueOnce(mockAgendamento);
      (prisma.agendamento.update as jest.Mock).mockResolvedValueOnce({ ...mockAgendamento, status: 'CONCLUIDO' });

      const res = await request(app)
        .put('/agendamentos/1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONCLUIDO' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CONCLUIDO');
    });
  });

  describe('DELETE /agendamentos/:id', () => {
    it('deve deletar um agendamento', async () => {
      (prisma.agendamento.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

      const res = await request(app)
        .delete('/agendamentos/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Agendamento removido fisicamente com sucesso.');
      expect(prisma.agendamento.delete).toHaveBeenCalledTimes(1);
    });
  });
});
