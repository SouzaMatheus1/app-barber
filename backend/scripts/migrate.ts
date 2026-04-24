import mysql from 'mysql2/promise';

/**
 * Script de Migração Multi-Tenant
 * Este script extrai os dados das duas empresas antigas no Aiven
 * e empurra para o Novo Banco Unificado Aiven, evitando colisões de ID (Offset +100000).
 */

const OLD_DB1_URL = process.env.OLD_DB1_URL || "mysql://user:pass@host:port/db1";
const OLD_DB2_URL = process.env.OLD_DB2_URL || "mysql://user:pass@host:port/db2";
const NEW_DB_URL = process.env.DATABASE_URL || "mysql://user:pass@host:port/db_unified";

const OFFSET = 100000;

const GLOBAL_TABLES = ['TipoEmpresa', 'Perfil', 'TipoItem', 'MetodoPagamento', 'TipoTransacao'];
const TENANT_TABLES = [
  'Cliente',
  'ItemCatalogo',
  'Transacao',
  'Plano',
  'Assinatura',
  'Profissional'
];
const CHILD_TABLES = [
  'ItemTransacao',
  'ItemPlano',
  'CreditoAssinatura'
];

async function migrate() {
    console.log("🚀 Iniciando migração multi-tenant...");
    
    const db1 = await mysql.createConnection(OLD_DB1_URL);
    const db2 = await mysql.createConnection(OLD_DB2_URL);
    const dbNew = await mysql.createConnection(NEW_DB_URL);

    // Desativa foreign keys para evitar erros de ordem na cópia bruta
    await dbNew.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Injetar as Tabelas Globais (Apenas copiamos da DB1 assumindo que são iguais)
    for (const table of GLOBAL_TABLES) {
        console.log(`Copiando dicionário global: ${table}`);
        const [rows] = await db1.query(`SELECT * FROM ${table}`) as any[];
        
        for (const row of rows) {
            const keys = Object.keys(row);
            const values = Object.values(row);
            const placeholders = keys.map(() => '?').join(', ');
            await dbNew.query(`INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
        }
    }

    // 2. Injetar Empresas na tabela tenant root
    await dbNew.query(`INSERT IGNORE INTO Empresa (id, nomeFantasia, slug, tipoEmpresaId) VALUES (1, 'Empresa Principal', 'master', 1)`);
    await dbNew.query(`INSERT IGNORE INTO Empresa (id, nomeFantasia, slug, tipoEmpresaId) VALUES (2, 'Empresa Secundaria', 'secundaria', 1)`);

    // 3. Processador Mágico de Tenancy e OFFSET
    async function copyTenantTable(sourceDb: mysql.Connection, empresaId: number, table: string, applyOffset: boolean) {
        console.log(`➡️  Copiando [${table}] da Empresa ${empresaId}...`);
        const [rows] = await sourceDb.query(`SELECT * FROM ${table}`) as any[];
        
        for (const row of rows) {
            const localRow = { ...row, empresaId }; // Injeta ForeignKey Multi-Tenant

            if (applyOffset) {
                // Altera as Chaves da Empresa 2 para somar o OFFSET (100.000) e não conflitar com a 1
                if (localRow.id) localRow.id += OFFSET;
                if (table === 'Transacao') {
                    if (localRow.profissionalId) localRow.profissionalId += OFFSET;
                    if (localRow.clienteId) localRow.clienteId += OFFSET;
                }
                if (table === 'Profissional') {
                    // perfilId não soma porque é tabela Global
                }
                if (table === 'Assinatura') {
                    if (localRow.clienteId) localRow.clienteId += OFFSET;
                    if (localRow.planoId) localRow.planoId += OFFSET;
                }
            }

            const keys = Object.keys(localRow);
            const values = Object.values(localRow);
            const placeholders = keys.map(() => '?').join(', ');
            
            try {
               await dbNew.query(`INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
            } catch (err: any) {
               console.error(`Erro ao inserir ${table} ID ${localRow.id}: `, err.message);
            }
        }
    }

    function isTableChild(table: string) { return CHILD_TABLES.includes(table); }

    async function copyChildTable(sourceDb: mysql.Connection, table: string, applyOffset: boolean) {
        console.log(`➡️  Copiando Filha [${table}] (Offset: ${applyOffset})...`);
        const [rows] = await sourceDb.query(`SELECT * FROM ${table}`) as any[];

        for (const row of rows) {
            const localRow = { ...row };

            if (applyOffset) {
                if (localRow.id) localRow.id += OFFSET;
                if (table === 'ItemTransacao') {
                    if (localRow.transacaoId) localRow.transacaoId += OFFSET;
                    if (localRow.itemId) localRow.itemId += OFFSET; 
                }
                if (table === 'ItemPlano') {
                    if (localRow.planoId) localRow.planoId += OFFSET;
                    if (localRow.itemId) localRow.itemId += OFFSET;
                }
                if (table === 'CreditoAssinatura') {
                    if (localRow.assinaturaId) localRow.assinaturaId += OFFSET;
                    if (localRow.itemId) localRow.itemId += OFFSET;
                }
            }

            const keys = Object.keys(localRow);
            const values = Object.values(localRow);
            const placeholders = keys.map(() => '?').join(', ');
            
            try {
               await dbNew.query(`INSERT IGNORE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
            } catch (err: any) {
               console.error(`Erro ao inserir filha ${table}: `, err.message);
            }
        }
    }

    // Processa os dados Master (DB 1)
    for (const table of TENANT_TABLES) await copyTenantTable(db1, 1, table, false);
    for (const table of CHILD_TABLES) await copyChildTable(db1, table, false);

    // Processa os dados com ID Offset (DB 2)
    for (const table of TENANT_TABLES) await copyTenantTable(db2, 2, table, true);
    for (const table of CHILD_TABLES) await copyChildTable(db2, table, true);

    await dbNew.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log("✅ Migração finalizada com Sucesso! Os dois bancos agora são um só.");
    process.exit(0);
}

migrate().catch(console.error);
