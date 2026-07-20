import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { tenantStorage } from './tenantContext';

const adapter = new PrismaMariaDb({
  host: (process.env.DATABASE_HOST as string || '127.0.0.1').replace(/"/g, '').trim(),
  user: (process.env.DATABASE_USER as string || 'admin').replace(/"/g, '').trim(),
  password: (process.env.DATABASE_PASSWORD as string || 'Password123!').replace(/"/g, '').trim(),
  database: (process.env.DATABASE_NAME as string || 'dump-prod').replace(/"/g, '').trim(),
  port: Number(process.env.DATABASE_PORT || 3306),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

export const systemPrisma = new PrismaClient({ adapter });

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
  'CreditoAssinatura',
  'Agendamento',
  'Ativo'
];

export async function tenantQueryExtension({ args, query, model, operation }: any) {
  const store = tenantStorage.getStore();

  // Se o modelo for suportado:
  if (TENANT_MODELS.includes(model)) {
    // Guardião de segurança: Impede vazamento global acidental
    if (!store?.empresaId) {
      throw new Error(`[Multi-tenant] Tentativa de acesso a '${model}' sem contexto de tenant ativo.`);
    }

    const bId = store.empresaId;
    const a = args as any;

    // Leituras e exclusões em massa
    if (['findMany', 'findFirst', 'updateMany', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
      a.where = { ...a.where, empresaId: bId };
    }

    // Criação única (escalar, compatível com o adapter MariaDB)
    if (operation === 'create') {
      if (a && a.data && !a.data.empresaId && !a.data.empresa) {
        a.data = { ...a.data, empresaId: bId };
      }
    }

    // Criação em massa
    if (operation === 'createMany') {
      if (a && Array.isArray(a.data)) {
        a.data = a.data.map((d: any) => ({ ...d, empresaId: bId }));
      } else if (a && a.data) {
        a.data = { ...a.data, empresaId: bId };
      }
    }

    // Operações baseadas em ID ou filtros únicos
    if (['findUnique', 'update', 'delete', 'upsert'].includes(operation)) {
      if (operation === 'upsert' && a) {
        if (a.create && !a.create.empresaId && !a.create.empresa) {
          a.create = { ...a.create, empresaId: bId };
        }
        if (a.update && !a.update.empresaId && !a.update.empresa) {
          a.update = { ...a.update, empresaId: bId };
        }
      }

      if (a && a.where) {
        a.where = { ...a.where, empresaId: bId };
      }
    }
  }
  return query(args);
}

export const prisma = systemPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query, model, operation }) {
        return tenantQueryExtension({ args, query, model, operation });
      }
    }
  }
}) as PrismaClient;