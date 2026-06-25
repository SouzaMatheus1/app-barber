import express from 'express';
import request from 'supertest';
import { isAuth, isAdmin } from '../middleware/auth';
import { tenantStorage } from '../database/tenantContext';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  let app: express.Express;

  beforeAll(() => {
    process.env.JWT_SECRET = 'middleware-secret';
    app = express();

    app.get('/test-auth', isAuth, (req, res) => {
      const store = tenantStorage.getStore();
      res.status(200).json({
        user: res.locals.user,
        tenantEmpresaId: store?.empresaId
      });
    });

    app.get('/test-admin', isAuth, isAdmin, (req, res) => {
      res.status(200).json({ message: 'Success admin' });
    });
  });

  describe('isAuth Middleware', () => {
    it('deve retornar 401 se nenhum token for fornecido', async () => {
      const res = await request(app).get('/test-auth');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token não fornecido');
    });

    it('deve retornar 401 se o token estiver mal formatado', async () => {
      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', 'Bearer');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token mal formatado');
    });

    it('deve retornar 401 se o token for inválido', async () => {
      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token inválido');
    });

    it('deve permitir acesso e injetar o tenantStorage com token válido', async () => {
      const token = jwt.sign(
        { id: 42, perfil: 'PROFISSIONAL', empresaId: 9 },
        process.env.JWT_SECRET as string
      );

      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(42);
      expect(res.body.user.perfil).toBe('PROFISSIONAL');
      expect(res.body.tenantEmpresaId).toBe(9);
    });
  });

  describe('isAdmin Middleware', () => {
    it('deve retornar 403 se o perfil do usuário não for ADMIN', async () => {
      const token = jwt.sign(
        { id: 42, perfil: 'PROFISSIONAL', empresaId: 9 },
        process.env.JWT_SECRET as string
      );

      const res = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Acesso negado. Apenas administradores podem acessar esta rota.');
    });

    it('deve permitir acesso para usuários com perfil ADMIN', async () => {
      const token = jwt.sign(
        { id: 1, perfil: 'ADMIN', empresaId: 9 },
        process.env.JWT_SECRET as string
      );

      const res = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Success admin');
    });
  });
});
