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
    ativo: {
      findFirst: jest.fn(),
    },
    assinatura: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    creditoAssinatura: {
      update: jest.fn(),
    },
    fechamentoCaixa: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(prisma);
      }
      return Promise.resolve([{}, {}]);
    }),
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
    (prisma.itemCatalogo.findMany as jest.Mock).mockReset();
    (prisma.assinatura.findFirst as jest.Mock).mockReset();
    (prisma.transacao.create as jest.Mock).mockReset();
    (prisma.transacao.findMany as jest.Mock).mockReset();
    (prisma.transacao.findUnique as jest.Mock).mockReset();
    (prisma.transacao.update as jest.Mock).mockReset();
    (prisma.transacao.delete as jest.Mock).mockReset();
    (prisma.creditoAssinatura.update as jest.Mock).mockReset();
    (prisma.ativo.findFirst as jest.Mock).mockReset();
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
        profissionalId: 1,
        data: new Date()
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockNovoItemBd);
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce(mockNovaTransacao);
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([]); // Para syncFechamentoCaixa

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

    it('deve retornar erro 400 se profissionalId for omitido em entradas (tipo 1)', async () => {
      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1, // ENTRADA
          descricao: 'Sem Profissional',
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('O profissional é obrigatório para registros de atendimento.');
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

    it('deve criar transação debitando créditos de assinatura do cliente', async () => {
      const mockItem = [{ id: 1, nome: 'Corte Simples', preco: 40.0 }];
      const mockAssinatura = {
        id: 5,
        clienteId: 2,
        status: 'ATIVA',
        creditos: [{ id: 101, itemId: 1, quantidadeRestante: 3 }],
        plano: {
          valorMensal: 100,
          itens: [{ itemId: 1, quantidade: 4 }] // 4 itens no plano
        }
      };
      const mockNovaTransacao = {
        id: 10,
        valorTotal: 0.0, // Como usou crédito, a transação custa 0 no total geral contábil
        tipoTransacaoId: 1,
        profissionalId: 1,
        data: new Date()
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockItem);
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinatura);
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce(mockNovaTransacao);
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([]); // Para syncFechamentoCaixa

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Uso de Crédito',
          profissionalId: 1,
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 1, usouCreditoAssinatura: true }]
        });

      expect(res.status).toBe(201);
      expect(res.body.valorTotal).toBe(0.0);
      expect(prisma.creditoAssinatura.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { quantidadeRestante: 2 }
      });
    });

    it('deve retornar erro 400 se cliente usar crédito de assinatura mas não tiver plano ativo', async () => {
      const mockItem = [{ id: 1, nome: 'Corte Simples', preco: 40.0 }];
      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockItem);
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(null); // Sem assinatura ativa

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Uso Inválido',
          profissionalId: 1,
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 1, usouCreditoAssinatura: true }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('O cliente marcou o uso de crédito mas não possui assinatura ativa no momento.');
    });

    it('deve retornar erro 400 se o plano não incluir o serviço ao usar crédito', async () => {
      const mockItem = [{ id: 1, nome: 'Corte Simples', preco: 40.0 }];
      const mockAssinatura = {
        id: 5,
        clienteId: 2,
        status: 'ATIVA',
        creditos: [{ id: 101, itemId: 2, quantidadeRestante: 3 }], // Créditos apenas para item 2
        plano: {
          valorMensal: 100,
          itens: [{ itemId: 2, quantidade: 4 }]
        }
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockItem);
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinatura);

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Uso Fora do Plano',
          profissionalId: 1,
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 1, usouCreditoAssinatura: true }] // Requer item 1
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('O plano do cliente não inclui o serviço: Corte Simples');
    });

    it('deve retornar erro 400 se o cliente não tiver créditos suficientes do serviço', async () => {
      const mockItem = [{ id: 1, nome: 'Corte Simples', preco: 40.0 }];
      const mockAssinatura = {
        id: 5,
        clienteId: 2,
        status: 'ATIVA',
        creditos: [{ id: 101, itemId: 1, quantidadeRestante: 0 }], // 0 créditos restantes
        plano: {
          valorMensal: 100,
          itens: [{ itemId: 1, quantidade: 4 }]
        }
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockItem);
      (prisma.assinatura.findFirst as jest.Mock).mockResolvedValueOnce(mockAssinatura);

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Sem Saldo',
          profissionalId: 1,
          clienteId: 2,
          itens: [{ itemId: 1, quantidade: 1, usouCreditoAssinatura: true }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Saldo insuficiente para o serviço: Corte Simples. Restante: 0');
    });

    it('deve retornar erro 400 se o ativo informado não pertencer ao cliente', async () => {
      const mockNovoItemBd = [{ id: 1, preco: 25.0 }];
      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockNovoItemBd);
      (prisma.ativo.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Corte com Ativo Inválido',
          profissionalId: 1,
          clienteId: 2,
          ativoId: 99,
          itens: [{ itemId: 1, quantidade: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('O ativo informado não pertence ao cliente.');
    });

    it('deve criar uma nova transação com ativo com sucesso se pertencer ao cliente', async () => {
      const mockNovoItemBd = [{ id: 1, preco: 25.0 }];
      const mockNovaTransacao = {
        id: 1,
        valorTotal: 25.0,
        tipoTransacaoId: 1,
        profissionalId: 1,
        clienteId: 2,
        ativoId: 10,
        data: new Date()
      };

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockNovoItemBd);
      (prisma.ativo.findFirst as jest.Mock).mockResolvedValueOnce({ id: 10, clienteId: 2, nome: 'Ativo 10' });
      (prisma.transacao.create as jest.Mock).mockResolvedValueOnce(mockNovaTransacao);
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([]);

      const res = await request(app)
        .post('/transacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tipoTransacaoId: 1,
          descricao: 'Corte com Ativo Válido',
          profissionalId: 1,
          clienteId: 2,
          ativoId: 10,
          itens: [{ itemId: 1, quantidade: 1 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.ativoId).toBe(10);
    });
  });

  describe('PUT /transacoes/:id', () => {
    it('deve editar uma transação existente com sucesso', async () => {
      const mockOriginal = { id: 1, data: new Date() };
      const mockAtualizado = {
        descricao: 'Edição',
        valorTotal: 60.0,
        tipoTransacaoId: 1,
        profissionalId: 1,
        clienteId: 2,
        data: new Date()
      };

      (prisma.transacao.findUnique as jest.Mock).mockResolvedValueOnce(mockOriginal);
      (prisma.transacao.update as jest.Mock).mockResolvedValueOnce(mockAtualizado);
      (prisma.transacao.findMany as jest.Mock).mockResolvedValueOnce([]); // Para syncFechamentoCaixa

      const res = await request(app)
        .put('/transacoes/1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          descricao: 'Edição',
          valorTotal: 60.0
        });

      expect(res.status).toBe(200);
      expect(res.body.valorTotal).toBe(60.0);
    });

    it('deve retornar erro 400 se a transação para edição não for encontrada', async () => {
      (prisma.transacao.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/transacoes/99')
        .set('Authorization', `Bearer ${token}`)
        .send({ descricao: 'Teste' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Registro não encontrado');
    });
  });

  describe('DELETE /transacoes/:id', () => {
    it('deve deletar uma transação existente chamando o $transaction', async () => {
      (prisma.transacao.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, data: new Date() });
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
