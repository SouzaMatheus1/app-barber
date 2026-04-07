import { prisma } from '../database/prisma';
import { TipoItem } from '@prisma/client';

export class ItemCatalogoService {
    async listAll(barbeariaId: number) {
        const itens = await prisma.itemCatalogo.findMany({
            where: { barbeariaId },
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

    async create(data: { nome: string, preco: number, comissao?: number, tipo: TipoItem }, barbeariaId: number) {
        const { nome, preco, comissao, tipo } = data;

        const exists = await prisma.itemCatalogo.findFirst({
            where: { nome, barbeariaId }
        });

        if (exists) {
            throw new Error('DUPLICATE_ITEM');
        }

        const item = await prisma.itemCatalogo.create({
            data: {
                nome,
                preco,
                comissao,
                tipo,
                barbeariaId
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

    async edit(id: number, data: { nome?: string, preco?: number, comissao?: number, tipo?: TipoItem }, barbeariaId: number) {
        const item = await prisma.itemCatalogo.findFirst({
            where: { id, barbeariaId }
        });

        if(!item)
            throw new Error('Item não encontrado ou acesso negado');

        const result = await prisma.itemCatalogo.update({
            where: { id },
            data: {
                nome: data.nome,
                preco: data.preco,
                comissao: data.comissao,
                tipo: data.tipo
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

    async delete(id: number, barbeariaId: number) {
        const item = await prisma.itemCatalogo.findFirst({
            where: { id, barbeariaId }
        });

        if (!item)
            throw new Error('Item não encontrado ou acesso negado')

        await prisma.itemCatalogo.delete({
            where: { id }
        });

        return { message: 'Registro excluído' };
    }
}