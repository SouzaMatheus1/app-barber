import { ItemTransacao, Transacao } from '@prisma/client';
import { prisma } from '../database/prisma';

export class ComissaoService {
    async calcularComissao(profissionalId: number, dataInicio?: string, dataFim?: string) {
        let profissionalNome = "Todos os profissionais";
        let filtro: any = {};

        if (profissionalId > 0) {
            const profissional = await prisma.profissional.findUnique({
                where: { id: profissionalId },
                select: { nome: true }
            });

            if (!profissional)
                throw new Error('Profissional não encontrado');
            
            profissionalNome = profissional.nome;
            filtro.profissionalId = profissionalId;
        }

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
                profissional: { select: { nome: true } },
                cliente: { 
                    include: { 
                        assinaturas: {
                            where: { status: 'ATIVA' },
                            include: { plano: { include: { itens: true } } }
                        }
                    }
                },
                itens: {
                    include: { item: true }
                }
            },
            orderBy: { data: 'desc' }
        });

        let totalVendido = 0;
        let totalComissao = 0;

        const transacoesDetalhadas = transacoes.map((t: any) => {
            let comissaoDestaTransacao = 0;
            
            const itensTransacaoDetalhados = t.itens.map((i: any) => {
                const valorBase = Number(i.precoUnitario); // Já é o proporcional se for assinatura
                const percentual = i.item.comissao ? Number(i.item.comissao) : 0;
                const valorComissaoItem = (valorBase * i.quantidade * percentual) / 100;
                comissaoDestaTransacao += valorComissaoItem;
                
                return {
                    label: `${i.quantidade}x ${i.item.nome}`,
                    valorReal: valorBase * i.quantidade,
                    usouCredito: i.usouCreditoAssinatura
                };
            });

            const volumeVendaTransacao = itensTransacaoDetalhados.reduce((acc: number, curr: any) => acc + curr.valorReal, 0);
            totalVendido += volumeVendaTransacao;
            totalComissao += comissaoDestaTransacao;

            return {
                id: t.id,
                profissional: t.profissional?.nome || 'N/A',
                cliente: t.cliente?.nome || 'Cliente Avulso',
                servicos: itensTransacaoDetalhados.map((it: any) => it.label).join(', '),
                dataHora: t.data,
                valorTotalVendaReal: volumeVendaTransacao, // Valor Real de Performance
                valorRecebidoCaixa: Number(t.valorTotal),    // Valor de Entrada no Caixa
                comissao: comissaoDestaTransacao
            };
        });

        return {
            profissional: profissionalNome,
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