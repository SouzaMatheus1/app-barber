import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';

if (!process.env.DATABASE_URL_B || !process.env.DATABASE_URL_A) {
  console.error("ERRO: Variáveis DATABASE_URL_B e DATABASE_URL_A não encontradas no ambiente");
  process.exit(1);
}

function createPrismaClient(connectionString: string) {
  const url = new URL(connectionString);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: Number(url.port) || 3306,
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

// Inicializa duas instâncias usando o Driver Adapter
const prismaOld = createPrismaClient(process.env.DATABASE_URL_B);
const prismaNew = createPrismaClient(process.env.DATABASE_URL_A);

const TARGET_EMPRESA_ID = 2; // Barbearia B
const BATCH_SIZE = 500;

// Dicionários Globais (Texto -> Novo ID)
const perfilMap = new Map<string, number>();
const tipoItemMap = new Map<string, number>();
const metodoPagamentoMap = new Map<string, number>();
const tipoTransacaoMap = new Map<string, number>();

// Mapas De-Para (Old ID -> New ID)
const profissionalMap = new Map<number, number>();
const clienteMap = new Map<number, number>();
const itemCatalogoMap = new Map<number, number>();
const planoMap = new Map<number, number>();
const assinaturaMap = new Map<number, number>();
const transacaoMap = new Map<number, number>();

async function loadGlobals() {
  console.log("📥 Carregando Dicionários Globais do Banco A...");
  const perfis = await prismaNew.perfil.findMany();
  perfis.forEach(p => perfilMap.set(p.descricao.toLowerCase(), p.id));

  const tiposItem = await prismaNew.tipoItem.findMany();
  tiposItem.forEach(t => tipoItemMap.set(t.descricao.toLowerCase(), t.id));

  const metodos = await prismaNew.metodoPagamento.findMany();
  metodos.forEach(m => metodoPagamentoMap.set(m.descricao.toLowerCase(), m.id));

  const tiposTransacao = await prismaNew.tipoTransacao.findMany();
  tiposTransacao.forEach(t => tipoTransacaoMap.set(t.descricao.toLowerCase(), t.id));
}

async function migrateTable(
  tableName: string,
  processBatch: (records: any[]) => Promise<void>
) {
  console.log(`\n⏳ Migrando tabela: ${tableName}...`);
  let skip = 0;
  let totalProcessados = 0;

  while (true) {
    // Busca dados puros (Raw) via limit/offset para contornar gargalos de RAM
    const records = await prismaOld.$queryRawUnsafe<any[]>(
      `SELECT * FROM ${tableName} LIMIT ${BATCH_SIZE} OFFSET ${skip}`
    );

    if (records.length === 0) break;

    try {
      await processBatch(records);
      totalProcessados += records.length;
      console.log(`✅ Lote processado (${skip} até ${skip + records.length}) - Total: ${totalProcessados}`);
    } catch (error) {
      console.error(`❌ ERRO crítico no lote ${skip} da tabela ${tableName}:`, error);
      // Aqui podemos decidir abortar a migração com 'throw error' ou continuar 
      // Depende da rigorosidade desejada, mas logamos para análise
    }

    skip += BATCH_SIZE;
  }
  console.log(`🎉 Tabela ${tableName} concluída: ${totalProcessados} registros migrados.`);
}

async function main() {
  try {
    await loadGlobals();

    console.log(`\n🏢 Inicializando Empresa de Destino (ID: ${TARGET_EMPRESA_ID})`);
    await prismaNew.empresa.upsert({
      where: { slug: 'barbearia-b' },
      update: {},
      create: {
        id: TARGET_EMPRESA_ID,
        nomeFantasia: 'Barbearia B',
        slug: 'barbearia-b',
        tipoEmpresaId: 1
      }
    });

    // 1. Profissional
    await migrateTable('Profissional', async (batch) => {
      const perfisB = await prismaOld.$queryRawUnsafe<any[]>('SELECT id, descricao FROM Perfil');
      const descricoesOld = new Map(perfisB.map(p => [p.id, p.descricao.toLowerCase()]));

      const novosPerfis = batch.map(r => {
        const desc = descricoesOld.get(r.perfilId) || '';
        return perfilMap.get(desc) || 1; 
      });

      const inserted = await prismaNew.$transaction(
        batch.map((r, i) => prismaNew.profissional.create({
          data: {
            empresaId: TARGET_EMPRESA_ID,
            nome: r.nome,
            email: `${TARGET_EMPRESA_ID}_${r.email}`, // Evita colisão de Unique Constraints no Banco Master
            senha: r.senha,
            criadoEm: r.criadoEm,
            ativo: r.ativo ? true : false,
            perfilId: novosPerfis[i]
          }
        }))
      );
      inserted.forEach((r, i) => profissionalMap.set(batch[i].id, r.id));
    });

    // 2. Cliente
    await migrateTable('Cliente', async (batch) => {
      const inserted = await prismaNew.$transaction(
        batch.map(r => prismaNew.cliente.create({
          data: {
            empresaId: TARGET_EMPRESA_ID,
            nome: r.nome,
            telefone: r.telefone,
            criadoEm: r.criadoEm,
            ativo: r.ativo ? true : false
          }
        }))
      );
      inserted.forEach((r, i) => clienteMap.set(batch[i].id, r.id));
    });

    // 3. ItemCatalogo
    await migrateTable('ItemCatalogo', async (batch) => {
      const tiposB = await prismaOld.$queryRawUnsafe<any[]>('SELECT id, descricao FROM TipoItem');
      const tiposOld = new Map(tiposB.map(t => [t.id, t.descricao.toLowerCase()]));

      const novosTipos = batch.map(r => {
        const desc = tiposOld.get(r.tipoItemId) || '';
        return tipoItemMap.get(desc) || 1;
      });

      const inserted = await prismaNew.$transaction(
        batch.map((r, i) => prismaNew.itemCatalogo.create({
          data: {
            empresaId: TARGET_EMPRESA_ID,
            nome: r.nome,
            preco: Number(r.preco),
            comissao: r.comissao ? Number(r.comissao) : null,
            quantidade: r.quantidade || 0,
            ativo: r.ativo ? true : false,
            tipoItemId: novosTipos[i]
          }
        }))
      );
      inserted.forEach((r, i) => itemCatalogoMap.set(batch[i].id, r.id));
    });

    // 4. Plano
    await migrateTable('Plano', async (batch) => {
      const inserted = await prismaNew.$transaction(
        batch.map(r => prismaNew.plano.create({
          data: {
            empresaId: TARGET_EMPRESA_ID,
            nome: r.nome,
            valorMensal: Number(r.valorMensal),
            ativo: r.ativo ? true : false,
            frequencia: r.frequencia
          }
        }))
      );
      inserted.forEach((r, i) => planoMap.set(batch[i].id, r.id));
    });

    // 5. ItemPlano
    await migrateTable('ItemPlano', async (batch) => {
      await prismaNew.$transaction(
        batch.map(r => {
          const novoPlanoId = planoMap.get(r.planoId);
          const novoItemId = itemCatalogoMap.get(r.itemId);

          if (!novoPlanoId || !novoItemId) {
             throw new Error(`Dependência Map ausente: Plano ${r.planoId} / Item ${r.itemId}`);
          }

          return prismaNew.itemPlano.create({
            data: {
              planoId: novoPlanoId,
              itemId: novoItemId,
              quantidade: r.quantidade
            }
          });
        })
      );
    });

    // 6. Assinatura
    await migrateTable('Assinatura', async (batch) => {
      const inserted = await prismaNew.$transaction(
        batch.map(r => {
          const novoClienteId = clienteMap.get(r.clienteId);
          const novoPlanoId = planoMap.get(r.planoId);

          if (!novoClienteId || !novoPlanoId) {
             throw new Error(`Dependência Map ausente: Cliente ${r.clienteId} / Plano ${r.planoId}`);
          }

          return prismaNew.assinatura.create({
            data: {
              empresaId: TARGET_EMPRESA_ID,
              status: r.status,
              diaVencimento: r.diaVencimento,
              dataProximoVencimento: r.dataProximoVencimento,
              dataUltimoPagamento: r.dataUltimoPagamento,
              criadoEm: r.criadoEm,
              clienteId: novoClienteId,
              planoId: novoPlanoId
            }
          });
        })
      );
      inserted.forEach((r, i) => assinaturaMap.set(batch[i].id, r.id));
    });

    // 7. CreditoAssinatura
    await migrateTable('CreditoAssinatura', async (batch) => {
      await prismaNew.$transaction(
        batch.map(r => {
          const novaAssinaturaId = assinaturaMap.get(r.assinaturaId);
          const novoItemId = itemCatalogoMap.get(r.itemId);

          if (!novaAssinaturaId || !novoItemId) {
             throw new Error(`Dependência Map ausente: Assinatura ${r.assinaturaId} / Item ${r.itemId}`);
          }

          return prismaNew.creditoAssinatura.create({
            data: {
              empresaId: TARGET_EMPRESA_ID,
              assinaturaId: novaAssinaturaId,
              itemId: novoItemId,
              quantidadeRestante: r.quantidadeRestante
            }
          });
        })
      );
    });

    // 8. Transacao
    await migrateTable('Transacao', async (batch) => {
      const metodosB = await prismaOld.$queryRawUnsafe<any[]>('SELECT id, descricao FROM MetodoPagamento');
      const metodosOld = new Map(metodosB.map(m => [m.id, m.descricao.toLowerCase()]));

      const tiposB = await prismaOld.$queryRawUnsafe<any[]>('SELECT id, descricao FROM TipoTransacao');
      const tiposOld = new Map(tiposB.map(t => [t.id, t.descricao.toLowerCase()]));

      const inserted = await prismaNew.$transaction(
        batch.map(r => {
          const novoClienteId = r.clienteId ? clienteMap.get(r.clienteId) : null;
          const novoProfissionalId = r.profissionalId ? profissionalMap.get(r.profissionalId) : null;

          const descMetodo = r.formaPagamentoId ? (metodosOld.get(r.formaPagamentoId) || '') : '';
          const novaFormaPagamentoId = metodoPagamentoMap.get(descMetodo) || null;

          const descTipo = tiposOld.get(r.tipoTransacaoId) || '';
          const novoTipoTransacaoId = tipoTransacaoMap.get(descTipo) || 1;

          return prismaNew.transacao.create({
            data: {
              empresaId: TARGET_EMPRESA_ID,
              descricao: r.descricao,
              valorTotal: Number(r.valorTotal),
              data: r.data,
              profissionalId: novoProfissionalId,
              clienteId: novoClienteId,
              tipoTransacaoId: novoTipoTransacaoId,
              formaPagamentoId: novaFormaPagamentoId,
              categoriaCustoId: null // Omitido neste escopo a menos que também tenha De-Para
            }
          });
        })
      );
      inserted.forEach((r, i) => transacaoMap.set(batch[i].id, r.id));
    });

    // 9. ItemTransacao
    await migrateTable('ItemTransacao', async (batch) => {
      await prismaNew.$transaction(
        batch.map(r => {
          const novaTransacaoId = transacaoMap.get(r.transacaoId);
          const novoItemId = itemCatalogoMap.get(r.itemId);

          if (!novaTransacaoId || !novoItemId) {
             throw new Error(`Dependência Map ausente: Transacao ${r.transacaoId} / Item ${r.itemId}`);
          }

          return prismaNew.itemTransacao.create({
            data: {
              empresaId: TARGET_EMPRESA_ID,
              transacaoId: novaTransacaoId,
              itemId: novoItemId,
              quantidade: r.quantidade || 1,
              precoUnitario: Number(r.precoUnitario),
              usouCreditoAssinatura: r.usouCreditoAssinatura ? true : false
            }
          });
        })
      );
    });

    console.log("🌟 Migração concluída com sucesso!");

  } catch (error) {
    console.error("🛑 Erro fatal na inicialização da migração:", error);
  } finally {
    // Esvazia os dicionários para liberar o Heap do Garbage Collector
    profissionalMap.clear(); clienteMap.clear(); transacaoMap.clear(); itemCatalogoMap.clear();
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

main();
