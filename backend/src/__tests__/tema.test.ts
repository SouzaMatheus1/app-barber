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
      empresa: {
        findUnique: jest.fn(),
      },
    },
  };
});

describe('Tema API', () => {
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

  describe('GET /temas/empresa/:slug', () => {
    it('deve retornar tema padrão se empresa existir', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'minha-empresa' });

      const res = await request(app)
        .get('/temas/empresa/minha-empresa');

      expect(res.status).toBe(200);
      expect(res.body.corPrimaria).toBe('#C9A84C');
      expect(prisma.empresa.findUnique).toHaveBeenCalledTimes(1);
    });

    it('deve retornar 404 se empresa não existir', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/temas/empresa/nao-existe');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Empresa não encontrada');
    });
  });

  describe('PUT /temas', () => {
    it('deve retornar 501 pois está desativado', async () => {
      const res = await request(app)
        .put('/temas')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(501);
      expect(res.body.error).toBe('Funcionalidade de temas temporariamente desativada.');
    });
  });
});
