import { prisma } from '../database/prisma';

export class ItemCatalogoService {
    async listAll() {
        const itens = await prisma.itemCatalogo.findMany({
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                tipo: true
            }
        });

        return itens;
    }

    async create(data: any) {
        const { nome, preco, comissao, tipoItemId } = data;

        const exists = await prisma.itemCatalogo.findFirst({
            where: { nome }
        });

        if (exists) {
            throw new Error('DUPLICATE_ITEM');
        }

        const item = await prisma.itemCatalogo.create({
            data: {
                nome,
                preco,
                comissao,
                tipo: { connect: { id: tipoItemId }}
            },
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                tipo: true
            }
        });

        return item;
    }

    async edit(id: number, data: { nome?: string, preco?: number, comissao?: number, tipoItemId?: number }) {
        const item = await prisma.itemCatalogo.findUnique({
            where: { id }
        });

        if(!item)
            throw new Error('Item não encontrado');

        const result = await prisma.itemCatalogo.update({
            where: { id },
            data: {
                nome: data.nome,
                preco: data.preco,
                comissao: data.comissao,
                tipoItemId: data.tipoItemId
            },
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                tipo: true
            }
        });

        return { result, message: 'Registro alterado'}
    }

    async delete(id: number) {
        const item = await prisma.itemCatalogo.findUnique({
            where: { id }
        });

        if (!item)
            throw new Error('Item não encontrado')

        await prisma.itemCatalogo.delete({
            where: { id }
        });

        return { message: 'Registro excluído' };
    }
}