import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

export class RelatorioService {
    async getVendasProdutos(dataInicial: Date, dataFinal: Date) {
        const store = tenantStorage.getStore();
        if (!store?.empresaId) throw new Error("Tenant não definido");
        const empresaId = store.empresaId;

        // Query crua otimizada para consumir pouca RAM (não carrega todas as entidades)
        const resultados = await prisma.$queryRaw`
            SELECT 
                ic.id as itemId,
                ic.nome as itemName,
                ti.descricao as tipoItem,
                SUM(it.quantidade) as quantidadeVendida,
                SUM(it.quantidade * it.precoUnitario) as receitaTotal
            FROM ItemTransacao it
            JOIN Transacao t ON it.transacaoId = t.id
            JOIN ItemCatalogo ic ON it.itemId = ic.id
            JOIN TipoItem ti ON ic.tipoItemId = ti.id
            WHERE t.empresaId = ${empresaId}
            AND t.data >= ${dataInicial}
            AND t.data <= ${dataFinal}
            GROUP BY ic.id, ic.nome, ti.descricao
            ORDER BY quantidadeVendida DESC
        `;

        return (resultados as any[]).map(row => ({
            ...row,
            quantidadeVendida: Number(row.quantidadeVendida),
            receitaTotal: Number(row.receitaTotal)
        }));
    }
}
