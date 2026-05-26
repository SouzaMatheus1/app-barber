import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { tenantStorage } from './tenantContext';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST as string,
  user: process.env.DATABASE_USER as string,
  password: process.env.DATABASE_PASSWORD as string,
  database: process.env.DATABASE_NAME as string,
  port: Number(process.env.DATABASE_PORT),
  connectionLimit: 5,
});

const basePrisma = new PrismaClient({ adapter });

const TENANT_MODELS = [
  'Profissional',
  'Cliente',
  'ItemCatalogo',
  'Transacao',
  'Plano',
  'Assinatura',
  'FechamentoCaixa',
  'CategoriaCusto',
  'ItemTransacao',
  'CreditoAssinatura'
];

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query, model, operation }) {
        const store = tenantStorage.getStore();

        // Se existir um tenant no contexto e o modelo for suportado:
        if (store?.empresaId && TENANT_MODELS.includes(model)) {
          const bId = store.empresaId;
          const a = args as any;

          // Leituras e exclusões em massa
          if (['findMany', 'findFirst', 'updateMany', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            a.where = { ...a.where, empresaId: bId };
          }

          // Criação única (CORRIGIDO PARA INJEÇÃO ESCALAR)
          if (operation === 'create') {
            a.data = { ...a.data, empresaId: bId };
          }

          // Criação em massa
          if (operation === 'createMany') {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ ...d, empresaId: bId }));
            } else {
              a.data = { ...a.data, empresaId: bId };
            }
          }

          // Operações baseadas em ID único
          if (['findUnique', 'update', 'delete'].includes(operation)) {
            const id = a.where?.id;
            if (id) {
              const modelNameLower = model.charAt(0).toLowerCase() + model.slice(1);
              const exists = await (basePrisma as any)[modelNameLower].count({
                where: { id, empresaId: bId }
              });
              
              if (exists === 0) {
                throw new Error(`[Multi-tenant] Acesso restrito ou registro inexistente.`);
              }
            }
          }
        }
        return query(args);
      }
    }
  }
}) as PrismaClient;