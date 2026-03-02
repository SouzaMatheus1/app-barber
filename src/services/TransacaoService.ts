import { prisma } from '../database/prisma';

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
        valorTotal: number,
        tipoTransacaoId: number,
        profissionalId: number,
        clienteId?: number,
        itens: { itemId: number, quantidade: number, precoUnitario: number } []
    }){
        const { descricao, valorTotal, tipoTransacaoId, profissionalId, clienteId, itens } = data;

        const transacao = await prisma.transacao.create({
            data: {
                valorTotal,
                descricao,
                tipo: { connect: { id: tipoTransacaoId } },
                profissional: { connect: { id: profissionalId } },
                ...(clienteId && { cliente: { connect: { id: clienteId } } }),
                itens: {
                    create: itens.map(item => ({
                        quantidade: item.quantidade,
                        precoUnitario: item.precoUnitario,
                        item: { connect: { id: item.itemId } }
                    }))
                }
            },
            include: {
                itens: true
            }
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
            }
        })
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