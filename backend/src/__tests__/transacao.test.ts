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
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    },
    itemCatalogo: {
      findMany: jest.fn(),
    },
    itemTransacao: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Transação API', () => {
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    token = jwt.sign(
      { id: 1, perfil: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /transacoes', () => {
    it('deve listar todas as transações', async () => {
      const mockTransacoes = [
        {
          id: 1,
          valorTotal: 50.0,
          data: new Date(),
          tipo: { descricao: 'ENTRADA' },
          profissional: { nome: 'Profissional' },
          cliente: { nome: 'Cliente' },
          itens: []
        }
      ];

      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce(mockTransacoes);

      const res = await request(app)
        .get('/transacoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].valorTotal).toBe(50.0);
    });

    it('deve retornar erro 500 em falha ao buscar', async () => {
      (prisma.transacao.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .get('/transacoes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro ao buscar transações');
    });
  });

  describe('POST /transacoes', () => {
    it('deve criar uma nova transação com sucesso', async () => {
      const mockNovoItemBd = [{ id: 1, preco: 25.0 }];
      const mockNovaTransacao = {
        id: 1,
        valorTotal: 50.0,
        tipoTransacaoId: 1,
        profissionalId: 1
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockNovoItemBd);
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce(mockNovaTransacao);

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Corte',
          profissionalId: 1,
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 2 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.valorTotal).toBe(50.0);
    });

    it('deve retornar erro 400 se itens da transação não existirem no catálogo', async () => {
      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce([]); // Não achou nenhum item

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          profissionalId: 1,
          itens: [{ itemId: 99, quantidade: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Um ou mais itens não estão cadastrados no catálogo.');
    });
  });

  describe('DELETE /transacoes/:id', () => {
    it('deve deletar uma transação existente chamando o $transaction', async () => {
      (prisma.transacao.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1 });
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([{}, {}]); // Retorno do transaction

      const res = await request(app)
        .delete('/transacoes/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Transação e itens excluídos com sucesso');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se transação não for encontrada para o delete', async () => {
      (prisma.transacao.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/transacoes/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Transação não encontrada');
    });
  });
});
