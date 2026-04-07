import { prisma } from '../database/prisma';
import { statusAssinatura, TipoTransacao } from '@prisma/client';

export class TransacaoService {
    async listAll(barbeariaId: number){
        const transacoes = await prisma.transacao.findMany({
            where: { barbeariaId },
            include: {
                profissional: { select: { id: true, nome: true } },
                cliente: { select: { id: true, nome: true } },
                itens: {
                    include: { 
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
        tipo: TipoTransacao,
        profissionalId: number,
        clienteId?: number,
        itens: { itemId: number, quantidade: number, usouCreditoAssinatura?: boolean } []
    }, barbeariaId: number){
        const { descricao, tipo, profissionalId, clienteId, itens } = data;

        const itensId = itens.map(item => item.itemId);

        // Garante que os itens pertencem à barbearia
        const itensBd = await prisma.itemCatalogo.findMany({
            where: { 
                id: { in: itensId },
                barbeariaId
            }
        });

        if (itens.length !== itensBd.length)
            throw new Error("Um ou mais itens não pertencem a esta barbearia ou não existem.");

        let totalVenda = 0;
        let requiresCredits = false;
        
        let assinaturaAtiva = null;
        if (clienteId) {
            assinaturaAtiva = await prisma.assinatura.findFirst({
                where: { clienteId, status: statusAssinatura.ATIVA, barbeariaId }
            });
        }

        const itensSelecionados = itens.map(itemRegistrado => {
            const itemSalvo = itensBd.find((itemBd: any) => itemBd.id == itemRegistrado.itemId);
            let valorItem = Number(itemSalvo?.preco);
            
            const usouCredito = itemRegistrado.usouCreditoAssinatura || false;
            
            if (usouCredito) {
               requiresCredits = true;
               if (!assinaturaAtiva) {
                   throw new Error("O cliente marcou o uso de crédito mas não possui assinatura ativa.");
               }
               
               const nomeNormalizado = itemSalvo?.nome.toLowerCase() || "";
               if (nomeNormalizado.includes('combo')) {
                   if (assinaturaAtiva.creditosCorte < itemRegistrado.quantidade) throw new Error('Saldo insuficiente de Cortes.');
                   if (assinaturaAtiva.creditosBarba < itemRegistrado.quantidade) throw new Error('Saldo insuficiente de Barbas.');
                   assinaturaAtiva.creditosCorte -= itemRegistrado.quantidade;
                   assinaturaAtiva.creditosBarba -= itemRegistrado.quantidade;
               } else if (nomeNormalizado.includes('barba') || nomeNormalizado.includes('bigode')) {
                   if (assinaturaAtiva.creditosBarba < itemRegistrado.quantidade) throw new Error('Saldo insuficiente para Barbas.');
                   assinaturaAtiva.creditosBarba -= itemRegistrado.quantidade;
               } else {
                   if (assinaturaAtiva.creditosCorte < itemRegistrado.quantidade) throw new Error('Saldo insuficiente para Cortes.');
                   assinaturaAtiva.creditosCorte -= itemRegistrado.quantidade;
               }
               valorItem = 0;
            }

            totalVenda += valorItem * itemRegistrado.quantidade;

            return {
                quantidade: itemRegistrado.quantidade,
                precoUnitario: valorItem,
                usouCreditoAssinatura: usouCredito,
                itemId: itemRegistrado.itemId
            }
        });

        const transacao = await prisma.$transaction(async (tx) => {
            // Verifica se o profissional pertence à barbearia
            const prof = await tx.profissional.findFirst({
                where: { id: profissionalId, barbeariaId }
            });
            if (!prof) throw new Error("Profissional não encontrado nesta barbearia");

            const trx = await tx.transacao.create({
                data: {
                    valorTotal: totalVenda,
                    descricao,
                    tipo,
                    barbeariaId,
                    profissionalId,
                    clienteId,
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
        tipo: TipoTransacao,
        profissionalId: number,
        clienteId?: number
    }, barbeariaId: number){
        const transacao = await prisma.transacao.findFirst({
            where: { id, barbeariaId }
        });

        if(!transacao)
            throw new Error('Registro não encontrado ou acesso negado');

        const result = await prisma.transacao.update({
            where: { id },
            data: {
                descricao: data.descricao,
                valorTotal: data.valorTotal,
                tipo: data.tipo,
                profissionalId: data.profissionalId,
                clienteId: data.clienteId
            }
        });

        return result;
    }

    async delete(id: number, barbeariaId: number) {
        const transacao = await prisma.transacao.findFirst({
            where: { id, barbeariaId }
        });

        if (!transacao)
            throw new Error('Transação não encontrada ou acesso negado');

        await prisma.$transaction([
            prisma.itemTransacao.deleteMany({ where: { transacaoId: id } }),
            prisma.transacao.delete({ where: { id } })
        ]);

        return { message: 'Transação excluída com sucesso' };
    }
}