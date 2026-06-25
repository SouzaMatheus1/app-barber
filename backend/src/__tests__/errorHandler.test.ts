import express from 'express';
import request from 'supertest';
import { errorHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/AppError';

describe('Global Error Handler Middleware', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();

    app.get('/app-error', (req, res, next) => {
      next(new AppError('Custom client error message', 418));
    });

    app.get('/generic-error', (req, res, next) => {
      next(new Error('Generic database failure'));
    });

    app.use(errorHandler);
  });

  it('deve formatar AppError corretamente com status e mensagem customizados', async () => {
    const res = await request(app).get('/app-error');

    expect(res.status).toBe(418);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Custom client error message'
    });
  });

  it('deve retornar status 500 e a mensagem do erro em modo desenvolvimento', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/generic-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Generic database failure'
    });
  });

  it('deve retornar status 500 e mensagem genérica "Internal server error" em produção', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/generic-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Internal server error'
    });
  });
});
