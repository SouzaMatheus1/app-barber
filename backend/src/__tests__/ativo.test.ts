import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
app.use(routes);

// Mocking o prisma client
jest.mock('../database/prisma', () => {
  const mockPrisma = {
    empresa: {
      findUnique: jest.fn(),
    },
    tipoEmpresaAtivo: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    cliente: {
      findUnique: jest.fn(),
    },
    categoriaVeiculo: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    especieAnimal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    ativo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ativoVeiculo: {
      create: jest.fn(),
      update: jest.fn(),
    },
    ativoAnimal: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve({});
    }),
  };
  return {
    prisma: mockPrisma,
    systemPrisma: mockPrisma,
  };
});

describe('Ativos API', () => {
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_para_o_jest';
    token = jwt.sign(
      { id: 1, perfil: 'ADMIN', empresaId: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /ativos', () => {
    it('deve criar um novo ativo do tipo veiculo com sucesso', async () => {
      const mockEmpresa = { id: 1, tipoEmpresaId: 2 }; // Lava Rapido
      const mockTipoEmpresaAtivo = { id: 1, tipoEmpresaId: 2, tipoAtivoId: 1 };
      const mockCliente = { id: 10, nome: 'Cliente Teste' };
      const mockCategoria = { id: 1, descricao: 'CARRO' };
      const mockAtivo = { id: 100, clienteId: 10, tipoAtivoId: 1, nome: 'Civic', empresaId: 1 };
      const mockAtivoCompleto = { ...mockAtivo, veiculo: { id: 50, ativoId: 100, modelo: 'Civic', categoriaId: 1, categoria: mockCategoria, placa: 'ABC-1234' } };

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.tipoEmpresaAtivo.findFirst as jest.Mock).mockResolvedValueOnce(mockTipoEmpresaAtivo);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(mockCliente);
      (prisma.categoriaVeiculo.findUnique as jest.Mock).mockResolvedValueOnce(mockCategoria);
      (prisma.ativo.create as jest.Mock).mockResolvedValueOnce(mockAtivo);
      (prisma.ativoVeiculo.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.ativo.findUnique as jest.Mock).mockResolvedValueOnce(mockAtivoCompleto);

      const res = await request(app)
        .post('/ativos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: 10,
          tipoAtivoId: 1,
          nome: 'Civic',
          detalhesVeiculo: {
            modelo: 'Civic',
            categoriaId: 1,
            placa: 'ABC-1234'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Civic');
      expect(res.body.veiculo.placa).toBe('ABC-1234');
    });

    it('deve retornar erro 400 se a categoria do veiculo for invalida ou inexistente', async () => {
      const mockEmpresa = { id: 1, tipoEmpresaId: 2 };
      const mockTipoEmpresaAtivo = { id: 1, tipoEmpresaId: 2, tipoAtivoId: 1 };
      const mockCliente = { id: 10, nome: 'Cliente Teste' };

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.tipoEmpresaAtivo.findFirst as jest.Mock).mockResolvedValueOnce(mockTipoEmpresaAtivo);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(mockCliente);
      (prisma.categoriaVeiculo.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/ativos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: 10,
          tipoAtivoId: 1,
          nome: 'Civic',
          detalhesVeiculo: {
            modelo: 'Civic',
            categoriaId: 99,
            placa: 'ABC-1234'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Categoria de veículo inválida ou inexistente');
    });

    it('deve retornar erro 400 se a especie do animal for invalida ou inexistente', async () => {
      const mockEmpresa = { id: 1, tipoEmpresaId: 3 }; // Pet shop
      const mockTipoEmpresaAtivo = { id: 2, tipoEmpresaId: 3, tipoAtivoId: 2 };
      const mockCliente = { id: 10, nome: 'Cliente Teste' };

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.tipoEmpresaAtivo.findFirst as jest.Mock).mockResolvedValueOnce(mockTipoEmpresaAtivo);
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValueOnce(mockCliente);
      (prisma.especieAnimal.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/ativos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: 10,
          tipoAtivoId: 2,
          nome: 'Rex',
          detalhesAnimal: {
            especieId: 99
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Espécie de animal inválida ou inexistente');
    });

    it('deve retornar erro 400 se o tipo de ativo nao for permitido para a empresa', async () => {
      const mockEmpresa = { id: 1, tipoEmpresaId: 2 }; // Lava Rapido (não permite Pet/Animal)

      (prisma.empresa.findUnique as jest.Mock).mockResolvedValueOnce(mockEmpresa);
      (prisma.tipoEmpresaAtivo.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/ativos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId: 10,
          tipoAtivoId: 2, // Animal
          nome: 'Rex',
          detalhesAnimal: { especieId: 1 }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Tipo de ativo não permitido para esta empresa.');
    });
  });

  describe('GET /clientes/:clienteId/ativos', () => {
    it('deve listar os ativos de um cliente', async () => {
      const mockAtivos = [
        { id: 100, nome: 'Civic', veiculo: { modelo: 'Civic' } }
      ];

      (prisma.ativo.findMany as jest.Mock).mockResolvedValueOnce(mockAtivos);

      const res = await request(app)
        .get('/clientes/10/ativos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].nome).toBe('Civic');
    });
  });

  describe('PUT /ativos/:id', () => {
    it('deve atualizar o ativo e seus detalhes com sucesso', async () => {
      const mockAtivoExistente = { id: 100, clienteId: 10, tipoAtivoId: 1, nome: 'Civic', veiculo: { categoriaId: 1 } };
      const mockAtivoAtualizado = { id: 100, clienteId: 10, tipoAtivoId: 1, nome: 'Civic Novo', veiculo: { modelo: 'Civic Novo', categoriaId: 1 } };
      const mockCategoria = { id: 1, descricao: 'CARRO' };

      let findUniqueCount = 0;
      (prisma.ativo.findUnique as jest.Mock).mockImplementation(() => {
        findUniqueCount++;
        return Promise.resolve(findUniqueCount === 1 ? mockAtivoExistente : mockAtivoAtualizado);
      });
      (prisma.categoriaVeiculo.findUnique as jest.Mock).mockResolvedValue(mockCategoria);

      const res = await request(app)
        .put('/ativos/100')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: 'Civic Novo',
          detalhesVeiculo: { modelo: 'Civic Novo', categoriaId: 1 }
        });

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Civic Novo');
    });
  });

  describe('DELETE /ativos/:id', () => {
    it('deve desativar o ativo com sucesso (soft-delete)', async () => {
      const mockAtivoExistente = { id: 100, clienteId: 10, tipoAtivoId: 1, nome: 'Civic' };

      (prisma.ativo.findUnique as jest.Mock).mockResolvedValueOnce(mockAtivoExistente);
      (prisma.ativo.update as jest.Mock).mockResolvedValueOnce({ ...mockAtivoExistente, ativo: false });

      const res = await request(app)
        .delete('/ativos/100')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Ativo desativado com sucesso.');
    });
  });

  describe('GET /categorias-veiculo', () => {
    it('deve retornar a lista de categorias de veiculo', async () => {
      const mockCategorias = [{ id: 1, descricao: 'CARRO' }];
      (prisma.categoriaVeiculo.findMany as jest.Mock).mockResolvedValueOnce(mockCategorias);

      const res = await request(app)
        .get('/categorias-veiculo')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockCategorias);
    });
  });

  describe('GET /especies-animal', () => {
    it('deve retornar a lista de especies de animal', async () => {
      const mockEspecies = [{ id: 1, descricao: 'CACHORRO' }];
      (prisma.especieAnimal.findMany as jest.Mock).mockResolvedValueOnce(mockEspecies);

      const res = await request(app)
        .get('/especies-animal')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockEspecies);
    });
  });
});
