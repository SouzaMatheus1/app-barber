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
        tipoTransacaoId: number,
        profissionalId: number,
        clienteId?: number,
        itens: { itemId: number, quantidade: number } []
    }){
        const { descricao, tipoTransacaoId, profissionalId, clienteId, itens } = data;

        const itensId = itens.map(item => item.itemId);

        const itensBd = await prisma.itemTransacao.findMany({
            where: { id: { in: itensId } }
        });

        if (itens.length !== itensBd.length)
            throw new Error("Um ou mais itens não estão cadastrados.");

        let totalVenda = 0;
        const itensSelecionados = itens.map(itemRegistrado => { // itemRegistrado é o item vindo do parametro
            const itemSalvo = itensBd.find(i => i.id == itemRegistrado.itemId);
            const valorItem = Number(itemSalvo?.precoUnitario);
            totalVenda += valorItem * itemRegistrado.quantidade;

            return {
                quantidade: itemRegistrado.quantidade,
                precoUnitario: valorItem,
                item: { connect: { id: itemRegistrado.itemId }}
            }
        });

        const transacao = await prisma.transacao.create({
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