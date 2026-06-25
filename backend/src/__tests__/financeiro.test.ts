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
      fechamentoCaixa: {
        findMany: jest.fn(),
      },
    },
  };
});

describe('Financeiro API', () => {
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

  describe('GET /financeiro/fluxo-caixa', () => {
    it('deve listar fluxo de caixa', async () => {
      const mockFechamentos = [
        { id: 1, data: new Date().toISOString(), saldoFinal: 100 },
      ];

      (prisma.fechamentoCaixa.findMany as jest.Mock).mockResolvedValueOnce(mockFechamentos);

      const res = await request(app)
        .get('/financeiro/fluxo-caixa?dataInicial=2023-01-01&dataFinal=2023-12-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.fechamentoCaixa.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
