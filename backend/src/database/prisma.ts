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
  'Agendamento'
];

export const prisma = systemPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query, model, operation }) {
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
            if (!a.data.empresaId && !a.data.empresa) {
              a.data = { ...a.data, empresaId: bId };
            }
          }

          // Criação em massa
          if (operation === 'createMany') {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ ...d, empresaId: bId }));
            } else {
              a.data = { ...a.data, empresaId: bId };
            }
          }

          // Operações baseadas em ID ou filtros únicos
          if (['findUnique', 'update', 'delete'].includes(operation)) {
            if (a.where) {
              const modelNameLower = model.charAt(0).toLowerCase() + model.slice(1);
              
              // Verifica se o registro existe globalmente no banco de dados
              const globalCount = await (systemPrisma as any)[modelNameLower].count({
                where: a.where
              });

              if (globalCount > 0) {
                // Se existe globalmente, verifica se pertence ao tenant ativo
                const tenantCount = await (systemPrisma as any)[modelNameLower].count({
                  where: { ...a.where, empresaId: bId }
                });
                
                if (tenantCount === 0) {
                  throw new Error(`[Multi-tenant] Acesso restrito ou registro inexistente.`);
                }
              }
            }
          }
        }
        return query(args);
      }
    }
  }
}) as PrismaClient;