import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(routes);

// Mocking o prisma client
jest.mock('../database/prisma', () => ({
  prisma: {
    profissional: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Auth API /login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar erro 401 se credenciais não forem enviadas corretamente', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(401);
  });

  it('deve logar com credenciais corretas e retornar token JWT', async () => {
    const mockHash = await bcrypt.hash('senha_secreta', 8);
    // @ts-ignore
    (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'mock-id-123',
      nome: 'Profissional Teste',
      email: 'teste@barbearia.com',
      senha: mockHash,
      perfil: { descricao: 'ADMIN' },
    });

    const res = await request(app)
      .post('/login')
      .send({ email: 'teste@barbearia.com', senha: 'senha_secreta' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.profissional).toHaveProperty('nome', 'Profissional Teste');
    expect(res.body.profissional).toHaveProperty('perfil', 'ADMIN');
  });

  it('deve retornar erro 401 quando o profissional não é encontrado (email incorreto)', async () => {
    // @ts-ignore
    (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/login')
      .send({ email: 'errado@barbearia.com', senha: '123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha incorretos');
  });

  it('deve retornar erro 401 quando a senha é incorreta', async () => {
    const mockHash = await bcrypt.hash('senha_secreta', 8);
    // @ts-ignore
    (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({
      senha: mockHash,
      perfil: { descricao: 'ADMIN' },
    });

    const res = await request(app)
      .post('/login')
      .send({ email: 'teste@barbearia.com', senha: 'senha_incorreta' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha incorretos');
  });
});
