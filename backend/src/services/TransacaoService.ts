import { prisma } from '../database/prisma';
import { ItemTransacao, statusAssinatura } from '@prisma/client';

export class TransacaoService {
    async listAll(){
        const transacoes = await prisma.transacao.findMany({
            include: {
                tipo: true,
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

    async create(data: {
        descricao?: string,
        tipoTransacaoId: number,
        profissionalId: number,
        clienteId?: number,
        itens: { itemId: number, quantidade: number, usouCreditoAssinatura?: boolean } []
    }){
        const { descricao, tipoTransacaoId, profissionalId, clienteId, itens } = data;

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
                where: { clienteId, status: statusAssinatura.ATIVA }
            });
        }

        const itensSelecionados = itens.map(itemRegistrado => { // itemRegistrado é o item vindo do parametro
            const itemSalvo = itensBd.find((itemBd: any) => itemBd.id == itemRegistrado.itemId);
            let valorItem = Number(itemSalvo?.preco);
            
            const usouCredito = itemRegistrado.usouCreditoAssinatura || false;
            
            if (usouCredito) {
               requiresCredits = true;
               if (!assinaturaAtiva) {
                   throw new Error("O cliente marcou o uso de crédito mas não possui assinatura ativa no momento.");
               }
               
               const nomeNormalizado = itemSalvo?.nome.toLowerCase() || "";
               if (nomeNormalizado.includes('combo')) {
                   // Combo = 1 corte + 1 barba
                   if (assinaturaAtiva.creditosCorte < itemRegistrado.quantidade) throw new Error('Saldo insuficiente de Cortes para o Combo.');
                   if (assinaturaAtiva.creditosBarba < itemRegistrado.quantidade) throw new Error('Saldo insuficiente de Barbas para o Combo.');
                   assinaturaAtiva.creditosCorte -= itemRegistrado.quantidade;
                   assinaturaAtiva.creditosBarba -= itemRegistrado.quantidade;
               } else if (nomeNormalizado.includes('barba') || nomeNormalizado.includes('bigode')) {
                   if (assinaturaAtiva.creditosBarba < itemRegistrado.quantidade) throw new Error('Saldo insuficiente para Barbas do plano.');
                   assinaturaAtiva.creditosBarba -= itemRegistrado.quantidade;
               } else {
                   if (assinaturaAtiva.creditosCorte < itemRegistrado.quantidade) throw new Error('Saldo insuficiente para Cortes do plano.');
                   assinaturaAtiva.creditosCorte -= itemRegistrado.quantidade;
               }
               valorItem = 0; // zerando p/ o caixa final
            }

            totalVenda += valorItem * itemRegistrado.quantidade;

            return {
                quantidade: itemRegistrado.quantidade,
                precoUnitario: valorItem,
                usouCreditoAssinatura: usouCredito,
                item: { connect: { id: itemRegistrado.itemId }}
            }
        });

        // Efetivar dentro do banco. (Usando transaction para nao quebrar em caso de erros subjacentes)
        const transacao = await prisma.$transaction(async (tx) => {
            const trx = await tx.transacao.create({
                data: {
                    valorTotal: totalVenda,
                    descricao,
                    tipo: { connect: { id: tipoTransacaoId } },
                    profissional: { connect: { id: profissionalId } },
                    ...(clienteId && { cliente: { connect: { id: clienteId } } }),
                    itens: {
                        create: itensSelecionados
                    }
                }
            });
            
            if (requiresCredits && assinaturaAtiva) {
                await tx.assinatura.update({
                   where: { id: assinaturaAtiva.id },
                   data: {
                       creditosBarba: assinaturaAtiva.creditosBarba,
                       creditosCorte: assinaturaAtiva.creditosCorte
                   }
                });
            }
            return trx;
        });

        return transacao;
    }

    async edit(id: number, data: {
        descricao?: string,
        valorTotal: number,
        tipoTransacaoId: number,
        profissionalId: number,
        clienteId?: number,
        itens: { itemId: number, quantidade: number, precoUnitario: number } []
    }){
        const transacao = await prisma.transacao.findUnique({
            where: { id }
        });

        if(!transacao)
            throw new Error('Registro não encontrado');

        const result = await prisma.transacao.update({
            where: { id },
            data: {
                descricao: data.descricao,
                valorTotal: data.valorTotal,
                tipoTransacaoId: data.tipoTransacaoId,
                profissionalId: data.profissionalId,
                clienteId: data.clienteId
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