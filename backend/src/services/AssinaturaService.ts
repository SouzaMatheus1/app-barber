import { prisma } from '../database/prisma';
import { statusAssinatura } from '@prisma/client';

export class AssinaturaService {
    // Planos
    async createPlano(data: { nome: string, valorMensal: number, itens: { itemId: number, quantidade: number }[] }) {
        return prisma.plano.create({
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                ativo: true,
                itens: {
                    create: data.itens.map(i => ({
                        itemId: i.itemId,
                        quantidade: i.quantidade
                    }))
                }
            },
            include: { itens: true }
        });
    }

    async getPlanos() {
        return prisma.plano.findMany({ 
            where: { ativo: true },
            include: { itens: { include: { item: true } } }
        });
    }

    async editPlano(id: number, data: { nome?: string, valorMensal?: number, itens?: { itemId: number, quantidade: number }[] }) {
        const plano = await prisma.plano.findUnique({ where: { id } });
        if (!plano) throw new Error('Plano não encontrado');

        return prisma.plano.update({
            where: { id },
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                ...(data.itens && {
                    itens: {
                        deleteMany: {},
                        create: data.itens.map(i => ({
                            itemId: i.itemId,
                            quantidade: i.quantidade
                        }))
                    }
                })
            },
            include: { itens: true }
        });
    }

    async deletePlano(id: number) {
        const plano = await prisma.plano.findUnique({ where: { id } });
        if (!plano) throw new Error('Plano não encontrado');

        return prisma.plano.update({
            where: { id },
            data: {
                ativo: false
            }
        });
    }

    // Assinaturas
    async subscribe(clienteId: number, planoId: number, profissionalIdParaTransacao: number) {
        const plano = await prisma.plano.findUnique({ 
            where: { id: planoId },
            include: { itens: true }
        });
        if (!plano) throw new Error('Plano não encontrado');

        const assinaturaAtiva = await prisma.assinatura.findFirst({
            where: { clienteId, status: statusAssinatura.ATIVA }
        });

        if (assinaturaAtiva) {
            await prisma.assinatura.update({
                where: { id: assinaturaAtiva.id },
                data: { status: statusAssinatura.INATIVA }
            });
        }

        const hoje = new Date();

        const novaAssinatura = await prisma.assinatura.create({
            data: {
                clienteId,
                planoId,
                status: statusAssinatura.ATIVA,
                diaVencimento: hoje.getDate(),
                creditos: {
                    create: plano.itens.map(i => ({
                        itemId: i.itemId,
                        quantidadeRestante: i.quantidade
                    }))
                }
            },
            include: { creditos: true }
        });

        // Registra o pagamento no caixa (best-effort: não reverte a assinatura se falhar)
        try {
            await prisma.transacao.create({
                data: {
                    valorTotal: plano.valorMensal,
                    descricao: `Pagamento/Renovação Plano de Assinatura: ${plano.nome}`,
                    clienteId,
                    profissionalId: profissionalIdParaTransacao,
                    tipoTransacaoId: 1 // 1 equivale a ENTRADA
                }
            });
        } catch (err) {
            console.warn('Aviso: Assinatura criada mas falhou ao registrar no caixa:', err);
        }

        return novaAssinatura;
    }

    async getAssinaturaAtivaByClienteId(clienteId: number) {
        const assinatura = await prisma.assinatura.findFirst({
            where: { clienteId, status: statusAssinatura.ATIVA },
            orderBy: { id: 'desc' },
            include: { 
                plano: { include: { itens: true } },
                creditos: { include: { item: true } }
            }
        });

        if (!assinatura) return null;

        const totalItensNoPlano = assinatura.plano.itens.reduce((acc, i) => acc + i.quantidade, 0);
        const valorProporcional = totalItensNoPlano > 0 
            ? Number(assinatura.plano.valorMensal) / totalItensNoPlano 
            : 0;

        return {
            ...assinatura,
            valorProporcional
        };
    }

    async getAssinaturas() {
        return prisma.assinatura.findMany({
            include: { 
                cliente: true, 
                plano: true,
                creditos: { include: { item: true } }
            }
        });
    }
}
