import { ItemTransacao, Transacao } from '@prisma/client';
import { prisma } from '../database/prisma';

export class ComissaoService {
    async calcularComissao(profissionalId: number, dataInicio?: string, dataFim?: string) {
        const profissional = await prisma.profissional.findUnique({
            where: { id: profissionalId },
            select: { nome: true }
        });

        if (!profissional)
            throw new Error('Profissional não encontrado');

        let filtro: any = { profissionalId };

        if (dataInicio || dataFim) {
            filtro.criadoEm = {};
            if (dataInicio)
                filtro.criadoEm.gte = new Date(dataInicio); // gte = Greater than or equal (Maior ou igual)

            if (dataFim)
                filtro.criadoEm.lte = new Date(dataFim);    // lte = Less than or equal (Menor ou igual)
        }

        const transacoes = await prisma.transacao.findMany({
            where: filtro,
            include: {
                itens: {
                    include: { item: true } // Traz o item do catálogo para pegarmos a porcentagem da comissão
                }
            }
        });

        let totalVendido = 0;
        let totalComissao = 0;

        transacoes.forEach((transacao: Transacao) => {
            transacao.itens.forEach((itemVendido: ItemTransacao) => {
                const valorTotalDoItem = itemVendido.quantidade * Number(itemVendido.precoUnitario);

                const percentualComissao = itemVendido.item.comissao ? Number(itemVendido.item.comissao) : 0;

                const valorComissao = (valorTotalDoItem * percentualComissao) / 100;

                totalVendido += valorTotalDoItem;
                totalComissao += valorComissao;
            });
        });

        return {
            profissional: profissional.nome,
            periodo: {
                inicio: dataInicio || 'Todo o período',
                fim: dataFim || 'Todo o período'
            },
            quantidadeTransacoes: transacoes.length,
            resumoFinanceiro: {
                totalVendido: totalVendido,
                valorReceber: totalComissao,
                // parteDaBarbearia: totalVendido - totalComissao
            }
        };
    }
}