import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(routes);

// Mocking o prisma client
jest.mock('../database/prisma', () => ({
  prisma: {
    profissional: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Profissional API', () => {
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

  describe('GET /profissionais', () => {
    it('deve listar todos os profissionais', async () => {
      const mockProfissionais = [
        { id: 1, nome: 'Admin Teste', email: 'admin@teste.com', perfil: { descricao: 'ADMIN' }, criadoEm: new Date() },
        { id: 2, nome: 'Barbeiro Teste', email: 'barbeiro@teste.com', perfil: { descricao: 'BARBEIRO' }, criadoEm: new Date() }
      ];

      (prisma.profissional.findMany as jest.Mock).mockResolvedValueOnce(mockProfissionais);

      const res = await request(app)
        .get('/profissionais')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].nome).toBe('Admin Teste');
    });

    it('deve retornar erro 500 se o prisma falhar ao listar', async () => {
      (prisma.profissional.findMany as jest.Mock).mockRejectedValueOnce(new Error('Erro DB'));

      const res = await request(app)
        .get('/profissionais')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro ao buscar profissionais');
    });
  });

  describe('POST /profissionais', () => {
    it('deve criar um novo profissional (email não cadastrado)', async () => {
      const mockNovoProfissional = {
        id: 3,
        nome: 'Novo Profissional',
        email: 'novo@teste.com',
        perfil: { descricao: 'BARBEIRO' },
        criadoEm: new Date(),
      };

      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce(null); // email não existe
      (prisma.profissional.create as jest.Mock).mockResolvedValueOnce(mockNovoProfissional);

      const res = await request(app)
        .post('/profissionais')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Novo Profissional', email: 'novo@teste.com', senha: '123', perfilId: 2 });

      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Novo Profissional');
      expect(prisma.profissional.create).toHaveBeenCalledTimes(1);
    });

    it('deve retornar 500 se tentar cadastrar e-mail já existente', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, email: 'existente@teste.com' });

      const res = await request(app)
        .post('/profissionais')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Novo', email: 'existente@teste.com', senha: '123', perfilId: 2 });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro ao cadastrar profissional'); // A mensagem padrão do catch no Controller
    });
  });

  describe('PUT /profissionais/:id', () => {
    it('deve editar um profissional existente', async () => {
      const mockProfissionalEditado = {
        id: 1,
        nome: 'Admin Editado',
        email: 'admin@teste.com',
        perfil: { descricao: 'ADMIN' },
        criadoEm: new Date(),
      };

      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, email: 'admin@teste.com' }); // verifica usuario existe
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, email: 'admin@teste.com' }); // verifica email 
      (prisma.profissional.update as jest.Mock).mockResolvedValueOnce(mockProfissionalEditado);

      const res = await request(app)
        .put('/profissionais/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Admin Editado', email: 'admin@teste.com' });

      expect(res.status).toBe(201);
      expect(res.body.result.nome).toBe('Admin Editado');
      expect(res.body.message).toBe('Registro alterado');
    });

    it('deve retornar 500 ao editar um profissional inexistente', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/profissionais/99')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Editado' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Erro ao editar registro');
    });
  });

  describe('DELETE /profissionais/:id', () => {
    it('deve deletar um profissional existente', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce({ id: 1, nome: 'Admin' });
      (prisma.profissional.delete as jest.Mock).mockResolvedValueOnce({});

      const res = await request(app)
        .delete('/profissionais/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400); // Controller de profissional retorna 400 no sucesso no método delete!
      expect(res.body.message).toBe('Registro excluído');
    });

    it('deve retornar erro 400 se o profissional não existir para deletar', async () => {
      (prisma.profissional.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/profissionais/99')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário não encontrado');
    });
  });
});
