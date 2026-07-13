import express from 'express';
import request from 'supertest';
import { routes } from '../routes/routes';
import { prisma } from '../database/prisma';
import jwt from 'jsonwebtoken';
import { tenantStorage } from '../database/tenantContext';

const app = express();
app.use(express.json());
// Middleware to simulate tenant storage correctly during tests
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as any;
            tenantStorage.run({ empresaId: decoded.empresaId }, () => {
                next();
            });
        } catch {
            next();
        }
    } else {
        next();
    }
});
app.use(routes);

jest.mock('../database/prisma', () => {
  return {
    prisma: {
      $queryRaw: jest.fn(),
    },
  };
});

describe('Relatorio API', () => {
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

  describe('GET /relatorios/vendas-produtos', () => {
    it('deve retornar relatório de vendas de produtos', async () => {
      const mockResult = [
        {
          itemId: 1,
          itemName: 'Pomada',
          tipoItem: 'Produto',
          quantidadeVendida: 10,
          receitaTotal: 250.5
        }
      ];

      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .get('/relatorios/vendas-produtos?dataInicial=2023-01-01&dataFinal=2023-12-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].itemName).toBe('Pomada');
      expect(res.body[0].quantidadeVendida).toBe(10);
      expect(res.body[0].receitaTotal).toBe(250.5);
    });

    it('deve falhar se dataInicial e dataFinal não forem enviados', async () => {
      const res = await request(app)
        .get('/relatorios/vendas-produtos')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
