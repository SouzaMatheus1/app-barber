import { prisma } from '../database/prisma';
import { Transacao, ItemTransacao } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export class CaixaService {
    async resumoDiario(dataString?: string) {
        dayjs.extend(utc);
        dayjs.extend(timezone);

        const dataAlvo = dataString ? dayjs.tz(dataString, "America/Sao_Paulo") : dayjs().tz("America/Sao_Paulo");
        const inicioDia = dataAlvo.startOf('day').toDate();
        const fimDia = dataAlvo.endOf('day').toDate();

        const transacoesPassadas = await prisma.transacao.findMany({
            where: { data: { lt: inicioDia } },
            include: { itens: { include: { item: true } } }
        });

        let saldoInicial = 0;
        transacoesPassadas.forEach((transacao: any) => {
            transacao.itens.forEach((itemTransacao: any) => {
                const totalItem = itemTransacao.quantidade * Number(itemTransacao.precoUnitario);
                const percentualComissao = itemTransacao.item.comissao ? Number(itemTransacao.item.comissao) : 0;
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

        transacoesHoje.forEach((transacao: any) => {
            transacao.itens.forEach((itemTransacao: any) => {
                const totalItem = itemTransacao.quantidade * Number(itemTransacao.precoUnitario);
                const percentualComissao = itemTransacao.item.comissao ? Number(itemTransacao.item.comissao) : 0;
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
            detalhesTransacoes: transacoesHoje.map((transacao : any) => ({
                id: transacao.id,
                profissional: transacao.profissionalId,
                valorTotal: Number(transacao.valorTotal),
                data: transacao.data
            }))
        };
    }
}