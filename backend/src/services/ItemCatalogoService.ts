import { prisma } from '../database/prisma';

export class ItemCatalogoService {
    async listAll() {
        const itens = await prisma.itemCatalogo.findMany({
            where: { ativo: true },
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                quantidade: true,
                tipo: true
            }
        });

        return itens;
    }

    async create(data: any) {
        const { nome, preco, comissao, quantidade, tipoItemId } = data;

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
                quantidade: quantidade ? Number(quantidade) : 0,
                tipo: { connect: { id: tipoItemId } }
            },
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                quantidade: true,
                tipo: true
            }
        });

        return item;
    }

    async edit(id: number, data: { nome?: string, preco?: number, comissao?: number, quantidade?: number, tipoItemId?: number }) {
        const item = await prisma.itemCatalogo.findUnique({
            where: { id }
        });

        if (!item)
            throw new Error('Item não encontrado');

        const result = await prisma.itemCatalogo.update({
            where: { id },
            data: {
                ...(data.nome && { nome: data.nome }),
                ...(data.preco !== undefined && { preco: data.preco }),
                ...(data.comissao !== undefined && { comissao: data.comissao }),
                ...(data.quantidade !== undefined && { quantidade: data.quantidade }),
                ...(data.tipoItemId && { tipoItemId: data.tipoItemId }),
            },
            select: {
                id: true,
                nome: true,
                preco: true,
                comissao: true,
                quantidade: true,
                tipo: true
            }
        });

        return { result, message: 'Registro alterado' }
    }

    async delete(id: number) {
        const item = await prisma.itemCatalogo.findUnique({
            where: { id }
        });

        if (!item)
            throw new Error('Item não encontrado')

        await prisma.itemCatalogo.update({
            where: { id },
            data: { ativo: false }
        });

        return { message: 'Registro excluído' };
    }
}