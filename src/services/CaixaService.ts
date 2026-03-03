import { prisma } from '../database/prisma';

export class CaixaService {
    async resumoDiario(dataString?: string) {
        const dataAlvo = dataString ? new Date(dataString) : new Date();
        const inicioDia = new Date(dataAlvo.setHours(0, 0, 0, 0));
        const fimDia = new Date(dataAlvo.setHours(23, 59, 59, 999));

        const transacoesPassadas = await prisma.transacao.findMany({
            where: { data: { lt: inicioDia } },
            include: { itens: { include: { item: true } } }
        });

        let saldoInicial = 0;
        transacoesPassadas.forEach(t => {
            t.itens.forEach(i => {
                const totalItem = i.quantidade * Number(i.precoUnitario);
                const percentualComissao = i.item.comissao ? Number(i.item.comissao) : 0;
                saldoInicial += totalItem - ((totalItem * percentualComissao) / 100);
            });
        });

        const transacoesHoje = await prisma.transacao.findMany({
            where: { data: { gte: inicioDia, lte: fimDia } },
            include: {
                profissional: { select: { nome: true } },
                itens: { include: { item: true } }
            }
        });

        let faturamentoDia = 0;
        let parteBarbeariaDia = 0;
        let comissoesDia = 0;

        transacoesHoje.forEach(transacao => {
            transacao.itens.forEach(item => {
                const totalItem = item.quantidade * Number(item.precoUnitario);
                const percentualComissao = item.item.comissao ? Number(item.item.comissao) : 0;
                const valorComissao = (totalItem * percentualComissao) / 100;

                faturamentoDia += totalItem;
                comissoesDia += valorComissao;
                parteBarbeariaDia += (totalItem - valorComissao);
            });
        });

        return {
            data: inicioDia.toISOString().split('T')[0],
            saldoInicial,
            movimentoDia: {
                faturamentoTotal: faturamentoDia,
                parteBarbearia: parteBarbeariaDia,
                comissoesAPagar: comissoesDia
            },
            saldoFinal: saldoInicial + parteBarbeariaDia,
            quantidadeTransacoes: transacoesHoje.length,
            detalhesTransacoes: transacoesHoje.map(transacao => ({
                id: transacao.id,
                profissional: transacao.profissional,
                valorTotal: Number(transacao.valorTotal),
                data: transacao.data
            }))
        };
    }
}