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
    transacao: {
      findMany: jest.fn(),
    },
  },
}));

describe('Caixa API', () => {
  let tokenAdmin: string;
  let tokenBarbeiro: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
    
    tokenAdmin = jwt.sign(
      { id: 1, perfil: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    tokenBarbeiro = jwt.sign(
      { id: 2, perfil: 'BARBEIRO' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /caixa/diario', () => {
    it('deve gerar resumo de caixa com sucesso para ADMIN', async () => {
      // Mock para as transacoes passadas (mock da primeira chamada)
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          itens: [
            { quantidade: 1, precoUnitario: 100.0, item: { comissao: 40.0 } } // 100 - (100*0.4) = 60 vai pro saldo
          ]
        }
      ]);

      // Mock para as transacoes de hoje (mock da segunda chamada)
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 2,
          profissionalId: 2,
          valorTotal: 50.0,
          data: new Date(),
          profissional: { nome: 'Barbeiro' },
          itens: [
            { quantidade: 1, precoUnitario: 50.0, item: { comissao: 50.0 } } // Faturamento: 50, comissao: 25, parte: 25
          ]
        }
      ]);

      const res = await request(app)
        .get('/caixa/diario')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .query({ data: '2025-10-10' });

      expect(res.status).toBe(200);
      expect(res.body.saldoInicial).toBe(60.0);
      expect(res.body.movimentoDia.faturamentoTotal).toBe(50.0);
      expect(res.body.movimentoDia.comissoesAPagar).toBe(25.0);
      expect(res.body.movimentoDia.parteBarbearia).toBe(25.0);
      expect(res.body.saldoFinal).toBe(85.0); // 60 + 25 = 85
    });

    it('deve bloquear acesso para perfil que não seja ADMIN (BARBEIRO)', async () => {
      const res = await request(app)
        .get('/caixa/diario')
        .set('Authorization', `Bearer ${tokenBarbeiro}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
      expect(prisma.transacao.findMany).not.toHaveBeenCalled();
    });

    it('deve retornar erro 400 se a camada de service falhar', async () => {
      (prisma.transacao.findMany as jest.Mock).mockRejectedValueOnce(new Error('Erro DB'));

      const res = await request(app)
        .get('/caixa/diario')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Erro DB');
    });
  });
});
