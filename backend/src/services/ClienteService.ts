import { prisma } from '../database/prisma';
import { AssinaturaService } from './AssinaturaService';
import { statusAssinatura } from '@prisma/client';

export class ClienteService {
    async listAll() {
        const clientes = await prisma.cliente.findMany({
            where: { ativo: true },
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
                        itens: { include: { item: true } }
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
                ativo: true,
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

        if (telefone && telefone.trim() !== '') {
            const clienteExistente = await prisma.cliente.findFirst({
                where: {
                    telefone,
                    ativo: true
                }
            });

            if (clienteExistente) {
                throw new Error('Já existe um cliente ativo cadastrado com este telefone.');
            }
        }

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

        if (data.telefone && data.telefone.trim() !== '') {
            const clienteExistente = await prisma.cliente.findFirst({
                where: {
                    telefone: data.telefone,
                    ativo: true,
                    id: { not: id }
                }
            });

            if (clienteExistente) {
                throw new Error('Já existe outro cliente ativo cadastrado com este telefone.');
            }
        }

        if (data.planoId === 0) {
            try {
                await prisma.assinatura.updateMany({
                    where: { clienteId: id, status: statusAssinatura.ATIVA },
                    data: { status: statusAssinatura.INATIVA }
                });
            } catch (err) {
                console.error("Erro ao inativar assinatura na edicao", err);
            }
        } else if (data.planoId) {
            try {
                // Busca o primeiro profissional disponível para registrar o caixa
                const primeiroProf = await prisma.profissional.findFirst({ select: { id: true } });
                const profId = primeiroProf?.id ?? 1;
                const assinaturaService = new AssinaturaService();
                await assinaturaService.subscribe(id, data.planoId, profId);
            } catch (err) {
                console.error("Erro ao ativar/alterar assinatura na edicao", err);
                throw err;
            }
        }

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
                    select: { planoId: true, plano: { select: { nome: true } } }
                }
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

        await prisma.cliente.update({
            where: { id },
            data: { ativo: false }
        });

        return { message: 'Registro excluído com sucesso' };
    }
}