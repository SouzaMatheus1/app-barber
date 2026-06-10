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

  describe('GET /agendamentos/disponibilidade', () => {
    it('deve retornar a lista de slots disponiveis filtrando os ja agendados considerando timezone America/Sao_Paulo', async () => {
      // Mock da data de hoje para o teste (vamos fingir que é 2026-06-10T12:00:00.000Z em UTC, que é 09:00:00 em America/Sao_Paulo)
      const mockSystemTime = new Date('2026-06-10T12:00:00.000Z');
      jest.useFakeTimers({ now: mockSystemTime });

      // Profissional tem um agendamento das 10:00 às 11:00 local (13:00 às 14:00 UTC)
      // Como o fuso é America/Sao_Paulo, 10:00 local é 13:00 UTC
      const mockAgendamentos = [
        {
          id: 10,
          dataHoraInicio: new Date('2026-06-10T13:00:00.000Z'),
          dataHoraFim: new Date('2026-06-10T14:00:00.000Z'),
        }
      ];

      (prisma.agendamento.findMany as jest.Mock).mockResolvedValueOnce(mockAgendamentos);

      const res = await request(app)
        .get('/agendamentos/disponibilidade')
        .query({
          profissionalId: 2,
          data: '2026-06-10',
          duracaoMinutos: 60
        })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      
      // Desde as 08:00 às 20:00 local:
      // Agora é 09:00 local, com antecedência mínima de 29 min (até 09:29 local).
      // Então os slots de 08:00, 08:15, 08:30, 08:45, 09:00, 09:15 devem ser ignorados.
      // O primeiro slot possível após 09:29 é 09:30.
      // O agendamento mockado é das 10:00 às 11:00 local.
      // Para duracaoMinutos = 60, slots que colidem com [10:00 - 11:00] são:
      // - 09:15 (termina 10:15 > 10:00) - ja ignorado por antecedência
      // - 09:30 (termina 10:30 > 10:00)
      // - 09:45 (termina 10:45 > 10:00)
      // - 10:00 (inicia 10:00 < 11:00)
      // - 10:15 (inicia 10:15 < 11:00)
      // - 10:30 (inicia 10:30 < 11:00)
      // - 10:45 (inicia 10:45 < 11:00)
      // O slot das 11:00 é válido (inicia 11:00 >= 11:00).
      // Então 09:30, 09:45, 10:00, 10:15, 10:30, 10:45 devem ser bloqueados.
      // E 11:00 deve estar disponível.
      expect(res.body).toContain('11:00');
      expect(res.body).not.toContain('08:00');
      expect(res.body).not.toContain('09:00');
      expect(res.body).not.toContain('09:30');
      expect(res.body).not.toContain('10:00');
      expect(res.body).not.toContain('10:30');

      jest.useRealTimers();
    });
  });
});

