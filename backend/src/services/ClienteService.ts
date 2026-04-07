import { prisma } from '../database/prisma';
import { AssinaturaService } from './AssinaturaService';
import { statusAssinatura } from '@prisma/client';

export class ClienteService {
    async listAll(barbeariaId: number) {
        const clientes = await prisma.cliente.findMany({
            where: { barbeariaId },
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
                                qtBarbas: true
                            }
                        }
                    }
                }
            }
        });

        return clientes;
    }

    async searchByName(nome: string, barbeariaId: number) {
        const clientes = await prisma.cliente.findMany({
            where: {
                barbeariaId,
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

    async create(data: { nome: string, telefone?: string, planoId?: number }, barbeariaId: number) {
        const { nome, telefone, planoId } = data;

        const cliente = await prisma.cliente.create({
            data: {
                nome,
                telefone,
                barbeariaId // Vínculo obrigatório
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
                // Busca o primeiro profissional disponível DESTA barbearia para o registro da transação
                const primeiroProf = await prisma.profissional.findFirst({ 
                    where: { barbeariaId },
                    select: { id: true } 
                });
                const profId = primeiroProf?.id ?? 0;

                const assinaturaService = new AssinaturaService();
                await assinaturaService.subscribe(cliente.id, planoId, profId, barbeariaId); 
            } catch (err) {
                console.error("Erro ao ativar assinatura no cadastro rápido", err);
            }
        }

        return cliente;
    }

    async edit(id: number, data: { nome?: string, telefone?: string, planoId?: number }, barbeariaId: number) {
        // Verifica se o cliente pertence à barbearia antes de editar
        const clienteExistente = await prisma.cliente.findFirst({
            where: { id, barbeariaId }
        });

        if(!clienteExistente)
            throw new Error('Cliente não encontrado ou acesso negado');

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
                // Busca o primeiro profissional disponível DESTA barbearia
                const primeiroProf = await prisma.profissional.findFirst({ 
                    where: { barbeariaId },
                    select: { id: true } 
                });
                const profId = primeiroProf?.id ?? 0;
                const assinaturaService = new AssinaturaService();
                await assinaturaService.subscribe(id, data.planoId, profId, barbeariaId);
            } catch (err) {
                console.error("Erro ao ativar/alterar assinatura na edicao", err);
            }
        }

        return { result, message: 'Registro alterado com sucesso' }
    }

    async delete(id: number, barbeariaId: number) {
        const clienteExistente = await prisma.cliente.findFirst({
            where: { id, barbeariaId }
        });

        if (!clienteExistente)
            throw new Error('Cliente não encontrado ou acesso negado');

        await prisma.cliente.delete({
            where: { id }
        });

        return { message: 'Registro excluído com sucesso' };
    }
}