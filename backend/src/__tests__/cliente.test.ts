import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

// Mocking o prisma client
jest.mock('../database/prisma', () => ({
  prisma: {
    cliente: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Cliente API', () => {
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
    // Gerar um token válido para os testes
    token = jwt.sign(
      { id: 1, perfil: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /clientes', () => {
    it('deve listar todos os clientes', async () => {
      const mockClientes = [
        { id: 1, nome: 'João da Silva', telefone: '11999999999', criadoEm: new Date() },
        { id: 2, nome: 'Maria Souza', telefone: '11888888888', criadoEm: new Date() }
      ];

      (prisma.cliente.findMany as jest.Mock).mockResolvedValueOnce(mockClientes);

      const res = await request(app)
        .get('/clientes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].nome).toBe('João da Silva');
    });

    it('deve retornar erro 401 sem token', async () => {
      const res = await request(app).get('/clientes');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /clientes', () => {
    it('deve criar um novo cliente', async () => {
      const mockNovoCliente = {
        id: 3,
        nome: 'Pedro Alves',
        telefone: '11777777777',
        criadoEm: new Date(),
      };

      (prisma.cliente.create as jest.Mock).mockResolvedValueOnce(mockNovoCliente);

      const res = await request(app)
        .post('/clientes')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Pedro Alves', telefone: '11777777777' });

      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Pedro Alves');
      expect(prisma.cliente.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('PUT /clientes/:id', () => {
    it('deve editar um cliente existente', async () => {
      const mockClienteEditado = {
        id: 1,
        nome: 'João Silva Editado',
        telefone: '11999999999',
        criadoEm: new Date(),
      };

      // Mock findUnique para passar na validação de existência
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'João da Silva' });
      (prisma.cliente.update as jest.Mock).mockResolvedValueOnce(mockClienteEditado);

      const res = await request(app)
        .put('/clientes/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'João Silva Editado' });

      expect(res.status).toBe(200);
      expect(res.body.result.nome).toBe('João Silva Editado');
      expect(res.body.message).toBe('Registro alterado com sucesso');
    });

    it('deve retornar erro 400 se o cliente não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/clientes/99')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'João Silva Editado' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cliente não encontrado');
    });
  });

  describe('DELETE /clientes/:id', () => {
    it('deve deletar um cliente existente', async () => {
      // Mock findUnique para passar na validação
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'João da Silva' });
      (prisma.cliente.delete as jest.Mock).mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/clientes/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Registro excluído com sucesso');
      expect(prisma.cliente.delete).toHaveBeenCalledTimes(1);
    });

    it('deve retornar erro 400 se o cliente a deletar não existir', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/clientes/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cliente não encontrado');
    });
  });
});
