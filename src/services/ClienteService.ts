import { prisma } from '../database/prisma';

export class ClienteService {
    async listAll() {
        const clientes = await prisma.cliente.findMany({
            select: {
                id: true,
                nome: true,
                telefone: true,
                criadoEm: true
            }
        });

        return clientes;
    }

    async create(data: { nome: string, telefone?: string }) {
        const { nome, telefone } = data;

        const cliente = await prisma.cliente.create({
            data: {
                nome,
                telefone
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                criadoEm: true
            }
        });

        return cliente;
    }

    async edit(id: number, data: { nome?: string, telefone?: string }) {
        const cliente = await prisma.cliente.findUnique({
            where: { id }
        });

        if(!cliente)
            throw new Error('Cliente não encontrado');

        const result = await prisma.cliente.update({
            where: { id },
            data: {
                nome: data.nome,
                telefone: data.telefone
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                criadoEm: true
            }
        });

        return { result, message: 'Registro alterado com sucesso' }
    }

    async delete(id: number) {
        const cliente = await prisma.cliente.findUnique({
            where: { id }
        });

        if (!cliente)
            throw new Error('Cliente não encontrado');

        await prisma.cliente.delete({
            where: { id }
        });

        return { message: 'Registro excluído com sucesso' };
    }
}