import { prisma } from '../database/prisma';
import { ItemTransacao, statusAssinatura } from '@prisma/client';

export class TransacaoService {
    async listAll(){
        const transacoes = await prisma.transacao.findMany({
            include: {
                tipo: true,
                metodoPagamento: true,
                profissional: { select: { id: true, nome: true } },
                cliente: { select: { id: true, nome: true } },
                itens: {
                    include: { // para fazer o join
                        item: { select: { id: true, nome: true, tipo: true } }
                    }
                }
            },
            orderBy: { data: 'desc' }
        });

        return transacoes;
    }

    async create(dataParams: {
        descricao?: string,
        tipoTransacaoId: number,
        profissionalId: number,
        formaPagamentoId?: number,
        data?: Date,
        clienteId?: number,
        itens: { itemId: number, quantidade: number, usouCreditoAssinatura?: boolean } []
    }){
        const { descricao, tipoTransacaoId, profissionalId, clienteId, itens, formaPagamentoId } = dataParams;

        const itensId = itens.map(item => item.itemId);

        const itensBd = await prisma.itemCatalogo.findMany({
            where: { id: { in: itensId } }
        });

        if (itens.length !== itensBd.length)
            throw new Error("Um ou mais itens não estão cadastrados no catálogo.");

        let totalVenda = 0;
        let requiresCredits = false;
        
        let assinaturaAtiva = null;
        if (clienteId) {
            assinaturaAtiva = await prisma.assinatura.findFirst({
                where: { clienteId, status: statusAssinatura.ATIVA },
                include: { 
                    creditos: true,
                    plano: { include: { itens: true } }
                }
            });
        }

        const creditosParaAtualizar: { id: number, novaQuantidade: number }[] = [];

        const itensSelecionados = itens.map(itemRegistrado => {
            const itemSalvo = itensBd.find((itemBd: any) => itemBd.id == itemRegistrado.itemId);
            let valorItem = Number(itemSalvo?.preco);
            
            const usouCredito = itemRegistrado.usouCreditoAssinatura || false;
            
            if (usouCredito) {
               requiresCredits = true;
               if (!assinaturaAtiva) {
                   throw new Error("O cliente marcou o uso de crédito mas não possui assinatura ativa no momento.");
               }
               
               const creditoEncontrado = assinaturaAtiva.creditos.find(c => c.itemId === itemRegistrado.itemId);
               
               if (!creditoEncontrado) {
                   throw new Error(`O plano do cliente não inclui o serviço: ${itemSalvo?.nome}`);
               }

               if (creditoEncontrado.quantidadeRestante < itemRegistrado.quantidade) {
                   throw new Error(`Saldo insuficiente para o serviço: ${itemSalvo?.nome}. Restante: ${creditoEncontrado.quantidadeRestante}`);
               }

               // Registrar para atualização posterior (dentro da transaction)
               const jaRegistrado = creditosParaAtualizar.find(c => c.id === creditoEncontrado.id);
               if (jaRegistrado) {
                   jaRegistrado.novaQuantidade -= itemRegistrado.quantidade;
               } else {
                   creditosParaAtualizar.push({
                       id: creditoEncontrado.id,
                       novaQuantidade: creditoEncontrado.quantidadeRestante - itemRegistrado.quantidade
                   });
               }

               // Cálculo proporcional: Mensalidade / Total de créditos no plano
               const itensPlano = assinaturaAtiva.plano.itens || [];
               const totalItensNoPlano = itensPlano.reduce((sum, ip) => sum + ip.quantidade, 0);
               const mensalidade = Number(assinaturaAtiva.plano.valorMensal || 0);
               
               const valorProporcional = totalItensNoPlano > 0 ? mensalidade / totalItensNoPlano : 0;
               valorItem = valorProporcional; // Usar valor proporcional p/ o ItemTransacao
            }

            // Para o totalVenda do Caixa, se usou crédito, a contribuição financeira é 0
            if (!usouCredito) {
                totalVenda += valorItem * itemRegistrado.quantidade;
            }

            return {
                quantidade: itemRegistrado.quantidade,
                precoUnitario: valorItem,
                usouCreditoAssinatura: usouCredito,
                item: { connect: { id: itemRegistrado.itemId }}
            }
        });

        const transacao = await prisma.$transaction(async (tx) => {
            const trx = await tx.transacao.create({
                data: {
                    valorTotal: totalVenda,
                    descricao,
                    data: dataParams.data ? new Date(dataParams.data) : new Date(),
                    tipo: { connect: { id: tipoTransacaoId } },
                    profissional: { connect: { id: profissionalId } },
                    ...(clienteId && { cliente: { connect: { id: clienteId } } }),
                    ...(formaPagamentoId && { metodoPagamento: { connect: { id: formaPagamentoId } } }),
                    itens: {
                        create: itensSelecionados
                    }
                }
            });
            
            if (requiresCredits && creditosParaAtualizar.length > 0) {
                for (const cred of creditosParaAtualizar) {
                    await tx.creditoAssinatura.update({
                        where: { id: cred.id },
                        data: { quantidadeRestante: cred.novaQuantidade }
                    });
                }
            }
            return trx;
        });

        return transacao;
    }

    async edit(id: number, dataParams: {
        descricao?: string,
        valorTotal?: number,
        tipoTransacaoId?: number,
        profissionalId?: number,
        formaPagamentoId?: number,
        clienteId?: number,
        data?: Date
    }){
        const transacao = await prisma.transacao.findUnique({
            where: { id }
        });

        if(!transacao)
            throw new Error('Registro não encontrado');

        const result = await prisma.transacao.update({
            where: { id },
            data: {
                ...(dataParams.descricao && { descricao: dataParams.descricao }),
                ...(dataParams.valorTotal !== undefined && { valorTotal: dataParams.valorTotal }),
                ...(dataParams.tipoTransacaoId && { tipoTransacaoId: dataParams.tipoTransacaoId }),
                ...(dataParams.profissionalId && { profissionalId: dataParams.profissionalId }),
                ...(dataParams.clienteId && { clienteId: dataParams.clienteId }),
                ...(dataParams.formaPagamentoId && { formaPagamentoId: dataParams.formaPagamentoId }),
                ...(dataParams.data && { data: new Date(dataParams.data) })
            },
            select: {
                descricao: true,
                valorTotal: true,
                tipoTransacaoId: true,
                profissionalId: true,
                clienteId: true
            }
        });

        return result;
    }

    async delete(id: number) {
        const transacao = await prisma.transacao.findUnique({
            where: { id }
        });

        if (!transacao)
            throw new Error('Transação não encontrada');

        await prisma.$transaction([
            prisma.itemTransacao.deleteMany({ where: { transacaoId: id } }),
            prisma.transacao.delete({ where: { id } })
        ]);

        return { message: 'Transação e itens excluídos com sucesso' };
    }
}