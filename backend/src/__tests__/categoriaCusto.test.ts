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
      categoriaCusto: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

describe('Categoria Custo API', () => {
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

  describe('GET /categorias-custo', () => {
    it('deve listar categorias de custo', async () => {
      const mockCategorias = [
        { id: 1, descricao: 'Luz' },
        { id: 2, descricao: 'Água' },
      ];

      (prisma.categoriaCusto.findMany as jest.Mock).mockResolvedValueOnce(mockCategorias);

      const res = await request(app)
        .get('/categorias-custo')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].descricao).toBe('Luz');
      expect(prisma.categoriaCusto.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /categorias-custo', () => {
    it('deve criar uma nova categoria', async () => {
      const novaCategoria = { id: 3, descricao: 'Internet' };

      (prisma.categoriaCusto.create as jest.Mock).mockResolvedValueOnce(novaCategoria);

      const res = await request(app)
        .post('/categorias-custo')
        .set('Authorization', `Bearer ${token}`)
        .send({ descricao: 'Internet' });

      expect(res.status).toBe(201);
      expect(res.body.descricao).toBe('Internet');
      expect(prisma.categoriaCusto.create).toHaveBeenCalledTimes(1);
      expect(prisma.categoriaCusto.create).toHaveBeenCalledWith({ data: { descricao: 'Internet' } });
    });
  });

  describe('PUT /categorias-custo/:id', () => {
    it('deve atualizar uma categoria', async () => {
      const categoriaAtualizada = { id: 1, descricao: 'Luz Editada' };

      (prisma.categoriaCusto.update as jest.Mock).mockResolvedValueOnce(categoriaAtualizada);

      const res = await request(app)
        .put('/categorias-custo/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ descricao: 'Luz Editada' });

      expect(res.status).toBe(200);
      expect(res.body.descricao).toBe('Luz Editada');
      expect(prisma.categoriaCusto.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /categorias-custo/:id', () => {
    it('deve deletar uma categoria', async () => {
      (prisma.categoriaCusto.delete as jest.Mock).mockResolvedValueOnce({ id: 1 });

      const res = await request(app)
        .delete('/categorias-custo/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.categoriaCusto.delete).toHaveBeenCalledTimes(1);
    });
  });
});
