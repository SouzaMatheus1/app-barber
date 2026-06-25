import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(routes);

jest.mock('../database/prisma', () => {
  return {
    prisma: {
      empresa: {
        findUnique: jest.fn(),
      },
      cliente: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('PortalAuth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    (prisma.empresa.findUnique as jest.Mock).mockReset();
    (prisma.cliente.findFirst as jest.Mock).mockReset();
    (prisma.cliente.create as jest.Mock).mockReset();
    (prisma.cliente.update as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  describe('GET /portal/:slug/empresa', () => {
    it('deve retornar dados da empresa', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1, nomeFantasia: 'Barbearia X', slug: 'barbearia-x'
      });

      const res = await request(app).get('/portal/barbearia-x/empresa');

      expect(res.status).toBe(200);
      expect(res.body.nomeFantasia).toBe('Barbearia X');
      expect(prisma.empresa.findUnique).toHaveBeenCalledTimes(1);
    });

    it('deve retornar 404 se não achar a empresa', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/portal/barbearia-x/empresa');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /portal/:slug/auth/check-phone', () => {
    it('deve retornar erro 400 se telefone não for informado ou não for string', async () => {
      const res = await request(app)
        .post('/portal/barbearia-x/auth/check-phone')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Telefone é obrigatório e deve ser uma string.');
    });

    it('deve retornar 404 se a barbearia não for encontrada', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/check-phone')
        .send({ telefone: '123456789' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Barbearia não encontrada.');
    });

    it('deve retornar NOT_FOUND se cliente nao existir', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/check-phone')
        .send({ telefone: '123456789' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('NOT_FOUND');
    });

    it('deve retornar EXISTS_WITHOUT_PASSWORD se cliente existe mas nao tem senha', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 2, nome: 'João', senha: null });

      const res = await request(app)
        .post('/portal/barbearia-x/auth/check-phone')
        .send({ telefone: '123456789' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('EXISTS_WITHOUT_PASSWORD');
      expect(res.body.nome).toBe('João');
    });

    it('deve retornar EXISTS_WITH_PASSWORD se cliente tem senha', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1, senha: 'hash' });

      const res = await request(app)
        .post('/portal/barbearia-x/auth/check-phone')
        .send({ telefone: '123456789' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('EXISTS_WITH_PASSWORD');
    });
  });

  describe('POST /portal/:slug/auth/login', () => {
    it('deve retornar erro 400 se telefone ou senha não forem informados', async () => {
      const res1 = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ senha: '123' });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ telefone: '123' });
      expect(res2.status).toBe(400);
    });

    it('deve retornar 404 se a barbearia não for encontrada no login', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ telefone: '123', senha: '123' });

      expect(res.status).toBe(404);
    });

    it('deve retornar 401 se cliente não existir ou não tiver senha cadastrada', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ telefone: '123', senha: '123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciais inválidas ou senha não definida.');
    });

    it('deve logar com sucesso', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1, telefone: '123', senha: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ telefone: '123', senha: 'password' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('deve retornar 401 para senha incorreta', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1, telefone: '123', senha: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/login')
        .send({ telefone: '123', senha: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Senha incorreta.');
    });
  });

  describe('POST /portal/:slug/auth/register', () => {
    it('deve retornar 400 se telefone ou senha forem ausentes', async () => {
      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ nome: 'João' });

      expect(res.status).toBe(400);
    });

    it('deve retornar 404 se a barbearia não for encontrada ao registrar', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ telefone: '123', senha: '123', nome: 'João' });

      expect(res.status).toBe(404);
    });

    it('deve retornar erro 400 se o cliente já tiver cadastro completo', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 2, telefone: '123', senha: 'hash' });

      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ telefone: '123', senha: '123', nome: 'João' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cliente já possui cadastro completo. Faça login.');
    });

    it('deve completar cadastro (atualizar senha) se cliente existe sem senha', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce({ id: 2, telefone: '123', senha: null });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new-hash');
      (prisma.cliente.update as jest.Mock).mockResolvedValueOnce({ id: 2, nome: 'João', telefone: '123', senha: 'new-hash' });

      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ telefone: '123', senha: 'new-password' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(prisma.cliente.update).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 ao registrar novo cliente sem informar o nome', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null); // Novo cliente

      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ telefone: '123', senha: 'password' }); // Nome ausente

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome é obrigatório para novos clientes.');
    });

    it('deve registrar novo cliente do zero com sucesso', async () => {
      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, slug: 'barbearia-x' });
      (prisma.cliente.findFirst as jest.Mock).mockResolvedValueOnce(null); // Novo cliente
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('new-hash');
      (prisma.cliente.create as jest.Mock).mockResolvedValueOnce({ id: 3, nome: 'Mateus', telefone: '123', senha: 'new-hash' });

      const res = await request(app)
        .post('/portal/barbearia-x/auth/register')
        .send({ telefone: '123', senha: 'password', nome: 'Mateus' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(prisma.cliente.create).toHaveBeenCalledTimes(1);
    });
  });
});
