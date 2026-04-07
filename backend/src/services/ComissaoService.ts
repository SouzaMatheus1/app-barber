import { prisma } from '../database/prisma';

export class ComissaoService {
    async calcularComissao(barbeariaId: number, profissionalId: number, dataInicio?: string, dataFim?: string) {
        // Verifica se o profissional pertence à barbearia
        const profissional = await prisma.profissional.findFirst({
            where: { id: profissionalId, barbeariaId },
            select: { nome: true }
        });

        if (!profissional)
            throw new Error('Profissional não encontrado ou acesso negado');

        let filtro: any = { 
            profissionalId,
            barbeariaId // Isolamento
        };

        if (dataInicio || dataFim) {
            filtro.data = {};
            if (dataInicio) {
                const inicioStr = dataInicio.includes('T') ? dataInicio : `${dataInicio}T00:00:00.000Z`;
                filtro.data.gte = new Date(inicioStr);
            }

            if (dataFim) {
                const fimStr = dataFim.includes('T') ? dataFim : `${dataFim}T23:59:59.999Z`;
                filtro.data.lte = new Date(fimStr);
            }
        }

        const transacoes = await prisma.transacao.findMany({
            where: filtro,
            include: {
                cliente: { select: { nome: true } },
                itens: {
                    include: { item: true }
                }
            },
            orderBy: { data: 'desc' }
        });

        let totalVendido = 0;
        let totalComissao = 0;

        transacoes.forEach((transacao: any) => {
            transacao.itens.forEach((itemVendido: any) => {
                const isCredito = itemVendido.usouCreditoAssinatura;
                const basePreco = isCredito ? Number(itemVendido.item.preco) : Number(itemVendido.precoUnitario);
                
                const valorTotalBase = itemVendido.quantidade * basePreco;
                const percentualComissao = itemVendido.item.comissao ? Number(itemVendido.item.comissao) : 0;
                const valorComissao = (valorTotalBase * percentualComissao) / 100;
                
                const valorTotalDaVendaReal = itemVendido.quantidade * Number(itemVendido.precoUnitario);
                totalVendido += valorTotalDaVendaReal;
                totalComissao += valorComissao;
            });
        });

        const transacoesDetalhadas = transacoes.map((t: any) => {
            let comissaoDestaTransacao = 0;
            const servicos = t.itens.map((i: any) => {
                const isCredito = i.usouCreditoAssinatura;
                const basePreco = isCredito ? Number(i.item.preco) : Number(i.precoUnitario);
                const valorTotalBase = i.quantidade * basePreco;
                const percentual = i.item.comissao ? Number(i.item.comissao) : 0;
                comissaoDestaTransacao += (valorTotalBase * percentual) / 100;
                
                return `${i.quantidade}x ${i.item.nome}`;
            }).join(', ');

            return {
                id: t.id,
                cliente: t.cliente?.nome || 'Cliente Avulso',
                servicos: servicos,
                dataHora: t.data,
                valorTotalVendaReal: Number(t.valorTotal),
                comissao: comissaoDestaTransacao
            };
        });

        return {
            profissional: profissional.nome,
            periodo: {
                inicio: dataInicio || 'Todo o período',
                fim: dataFim || 'Todo o período'
            },
            quantidadeTransacoes: transacoes.length,
            totalMovimentado: totalVendido,
            totalComissao: totalComissao,
            transacoes: transacoesDetalhadas
        };
    }
}