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
    itemCatalogo: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ItemCatalogo API', () => {
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

  describe('GET /itens', () => {
    it('deve listar todos os itens do catálogo', async () => {
      const mockItens = [
        { id: 1, nome: 'Corte de Cabelo', preco: 35.0, comissao: null, tipo: { id: 1, descricao: 'SERVICO' } },
        { id: 2, nome: 'Pomada Modeladora', preco: 25.0, comissao: 10.0, tipo: { id: 2, descricao: 'PRODUTO' } }
      ];

      (prisma.itemCatalogo.findMany as jest.Mock).mockResolvedValueOnce(mockItens);

      const res = await request(app)
        .get('/itens')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].nome).toBe('Corte de Cabelo');
    });

    it('deve retornar erro 400 se houver falha ao listar', async () => {
      (prisma.itemCatalogo.findMany as jest.Mock).mockRejectedValueOnce(new Error('Erro BD'));

      const res = await request(app)
        .get('/itens')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Erro BD');
    });
  });

  describe('POST /itens', () => {
    it('deve criar um novo item', async () => {
      const mockNovoItem = {
        id: 3,
        nome: 'Sobrancelha',
        preco: 15.0,
        comissao: null,
        tipo: { id: 1, descricao: 'SERVICO' }
      };

      (prisma.itemCatalogo.create as jest.Mock).mockResolvedValueOnce(mockNovoItem);

      const res = await request(app)
        .post('/itens')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Sobrancelha', preco: 15.0, comissao: null, tipoItemId: 1 });

      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Sobrancelha');
      expect(prisma.itemCatalogo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT /itens/:id', () => {
    it('deve editar um item existente', async () => {
      const mockItemEditado = {
        id: 1,
        nome: 'Corte Degradê',
        preco: 40.0,
        comissao: null,
        tipo: { id: 1, descricao: 'SERVICO' }
      };

      (prisma.itemCatalogo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'Corte de Cabelo' });
      (prisma.itemCatalogo.update as jest.Mock).mockResolvedValueOnce(mockItemEditado);

      const res = await request(app)
        .put('/itens/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Corte Degradê', preco: 40.0, tipoItemId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.result.nome).toBe('Corte Degradê');
      expect(res.body.message).toBe('Registro alterado');
    });

    it('deve retornar erro 400 se o item não for encontrado para edição', async () => {
      (prisma.itemCatalogo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/itens/99')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Editado' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Item não encontrado');
    });
  });

  describe('DELETE /itens/:id', () => {
    it('deve deletar um item existente', async () => {
      (prisma.itemCatalogo.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'Corte' });
      (prisma.itemCatalogo.delete as jest.Mock).mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/itens/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Registro excluído');
      expect(prisma.itemCatalogo.delete).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se o item não for encontrado para deleção', async () => {
      (prisma.itemCatalogo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/itens/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Item não encontrado');
    });
  });
});
