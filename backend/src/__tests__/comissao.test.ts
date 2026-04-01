import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

jest.mock('../database/prisma', () => ({
  prisma: {
    profissional: {
      findUnique: jest.fn(),
    },
    transacao: {
      findMany: jest.fn(),
    },
  },
}));

describe('Comissão API', () => {
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
    token = jwt.sign(
      { id: 1, perfil: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /comissoes/profissional/:id', () => {
    it('deve gerar relatório de comissão do profissional com sucesso', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({ nome: 'Barbeiro Teste' });

      // Mock formatado para corresponder ao que o Prisma retornaria com os includes
      const mockTransacoes = [
        {
          id: 1,
          profissionalId: 2,
          itens: [
            {
              quantidade: 1,
              precoUnitario: 50.0,
              item: { id: 1, nome: 'Corte', comissao: 50.0 } // 50% de 50.0 = 25.0
            },
            {
              quantidade: 2,
              precoUnitario: 30.0,
              item: { id: 2, nome: 'Pomada', comissao: 10.0 } // 10% de (2 * 30.0) = 6.0
            }
          ]
        }
      ];

      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce(mockTransacoes);

      const res = await request(app)
        .get('/comissoes/profissional/2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profissional).toBe('Barbeiro Teste');
      expect(res.body.quantidadeTransacoes).toBe(1);
      expect(res.body.resumoFinanceiro.totalVendido).toBe(110.0); // 50 + 60
      expect(res.body.resumoFinanceiro.valorReceber).toBe(31.0); // 25 + 6
    });

    it('deve retornar erro 400 se profissional não for encontrado', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/comissoes/profissional/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Profissional não encontrado');
    });
  });
});
