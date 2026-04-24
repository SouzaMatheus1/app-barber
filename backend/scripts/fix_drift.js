/**
 * SCRIPT DE PREPARAÇÃO MULTI-TENANT (USAR NA PRODUÇÃO)
 * 
 * Roteiro exato para aplicar a migração no servidor sem perder os dados da base atual:
 * 
 * 1. Rode: `npx prisma db push`
 *    (Vai criar a tabela Empresa, mas vai DAR ERRO "Constraint fails" no final. É normal!)
 * 
 * 2. Rode: `node scripts/fix_drift.js`
 *    (Garante a existência do ID 1 na tabela mãe "Empresa")
 * 
 * 3. Rode de novo: `npx prisma db push`
 *    (O Prisma agora dará sucesso e conectará as FKs sem erro: "Your database is now in sync")
 * 
 * 4. (Opcional) Rodar o `scripts/migrate.ts` na sua máquina local apontando para as URLs
 *    dos bancos antigos caso precise mesclar os dados de outro servidor/cliente.
 * 
 * 5. Rode: `pm2 restart all`
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("Conectado ao banco local.");
    
    // Garante primeiro o Tipo
    await connection.query("INSERT IGNORE INTO `TipoEmpresa` (`id`, `descricao`) VALUES (1, 'Barbearia');");
    
    // Insere a Empresa 1 para satisfazer a Constraint do Prisma DB Push
    await connection.query("INSERT IGNORE INTO `Empresa` (`id`, `nomeFantasia`, `slug`, `tipoEmpresaId`, `criadoEm`) VALUES (1, 'Empresa Principal', 'master', 1, NOW());");
    console.log("✅ Empresa 1 (Master) inserida com sucesso!");
    
    process.exit(0);
  } catch (err) {
    console.error("Erro ao aplicar Fix:", err.message);
    process.exit(1);
  }
}
fix();
