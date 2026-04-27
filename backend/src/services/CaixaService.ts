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
            if (transacao.tipoTransacaoId === 2) { // SAIDA
                saldoInicial -= Number(transacao.valorTotal);
            } else { // ENTRADA (Calcula comissão se houver itens)
                transacao.itens.forEach((itemTransacao: any) => {
                    const totalItem = itemTransacao.quantidade * Number(itemTransacao.precoUnitario);
                    const percentualComissao = itemTransacao.item.comissao ? Number(itemTransacao.item.comissao) : 0;
                    saldoInicial += totalItem - ((totalItem * percentualComissao) / 100);
                });
            }
        });

        const transacoesHoje = await prisma.transacao.findMany({
            where: { data: { gte: inicioDia, lte: fimDia } },
            include: {
                profissional: { select: { nome: true } },
                itens: { include: { item: true } }
            }
        });

        let faturamentoDia = 0;
        let parteEmpresaDia = 0;
        let comissoesDia = 0;
        let despesasDia = 0;

        const clientesUnicos = new Set();
        let avulsosCount = 0;

        transacoesHoje.forEach((transacao: any) => {
            if (transacao.tipoTransacaoId === 2) { // SAIDA (Custo/Despesa)
                const valorSaida = Number(transacao.valorTotal);
                despesasDia += valorSaida;
                parteEmpresaDia -= valorSaida;
            } else { // ENTRADA (Venda/Serviço)
                if (transacao.clienteId) {
                    clientesUnicos.add(transacao.clienteId);
                } else {
                    avulsosCount++;
                }

                transacao.itens.forEach((itemTransacao: any) => {
                    const totalItem = itemTransacao.quantidade * Number(itemTransacao.precoUnitario);
                    const percentualComissao = itemTransacao.item.comissao ? Number(itemTransacao.item.comissao) : 0;
                    const valorComissao = (totalItem * percentualComissao) / 100;

                    faturamentoDia += totalItem;
                    comissoesDia += valorComissao;
                    parteEmpresaDia += (totalItem - valorComissao);
                });
            }
        });

        return {
            data: inicioDia.toISOString().split('T')[0],
            saldoInicial,
            movimentoDia: {
                faturamentoTotal: faturamentoDia,
                despesas: despesasDia,
                parteEmpresa: parteEmpresaDia,
                comissoesAPagar: comissoesDia
            },
            saldoFinal: saldoInicial + parteEmpresaDia,
            quantidadeTransacoes: transacoesHoje.length,
            atendimentosRealizados: clientesUnicos.size + avulsosCount,
            detalhesTransacoes: transacoesHoje.map((transacao : any) => ({
                id: transacao.id,
                profissional: transacao.profissionalId,
                valorTotal: Number(transacao.valorTotal),
                data: transacao.data
            }))
        };
    }
}