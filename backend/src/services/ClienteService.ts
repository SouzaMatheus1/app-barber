import { prisma } from '../database/prisma';
import { AssinaturaService } from './AssinaturaService';
import { statusAssinatura } from '@prisma/client';

export class ClienteService {
    async listAll() {
        const clientes = await prisma.cliente.findMany({
            select: {
                id: true,
                nome: true,
                telefone: true,
                criadoEm: true,
                assinaturas: {
                where: { status: statusAssinatura.ATIVA },
                select: {
                    planoId: true,
                    status: true,
                    plano: { 
                    select: {
                        id: true,
                        nome: true,
                        valorMensal: true,
                        qtCortes: true,
                        qtBarbas: true,
                        qtCombos: true
                    }
                    }
                }
                }
            }
            });

        return clientes;
    }

    async searchByName(nome: string) {
        const clientes = await prisma.cliente.findMany({
            where: {
                nome: {
                    contains: nome
                }
            },
            take: 10,
            select: {
                id: true,
                nome: true,
                telefone: true
            }
        });
        return clientes;
    }

    async create(data: { nome: string, telefone?: string, planoId?: number }) {
        const { nome, telefone, planoId } = data;

        const cliente = await prisma.cliente.create({
            data: {
                nome,
                telefone
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                criadoEm: true,
                assinaturas: {
                    where: { status: statusAssinatura.ATIVA },
                    select: { planoId: true }
                }
            }
        });

        if (planoId) {
            try {
                const assinaturaService = new AssinaturaService();
                await assinaturaService.subscribe(cliente.id, planoId, 1); // 1 = Admin padrão para este fluxo rápido
            } catch (err) {
                console.error("Erro ao ativar assinatura no cadastro rápido", err);
            }
        }

        return cliente;
    }

    async edit(id: number, data: { nome?: string, telefone?: string, planoId?: number }) {
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
                criadoEm: true,
                assinaturas: {
                    where: { status: statusAssinatura.ATIVA },
                    select: { planoId: true }
                }
            }
        });

        if (data.planoId) {
            try {
                const assinaturaService = new AssinaturaService();
                await assinaturaService.subscribe(id, data.planoId, 1); // 1 = Admin padrão para este fluxo rápido
            } catch (err) {
                console.error("Erro ao ativar/alterar assinatura na edicao", err);
            }
        }

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