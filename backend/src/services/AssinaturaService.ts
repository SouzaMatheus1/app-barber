import { prisma } from '../database/prisma';
import { statusAssinatura } from '@prisma/client';

export class AssinaturaService {
    // Planos
    async createPlano(data: { nome: string, valorMensal: number, frequencia?: 'SEMANAL' | 'QUINZENAL' | 'MENSAL', itens: { itemId: number, quantidade: number }[] }) {
        return prisma.plano.create({
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                frequencia: data.frequencia || 'MENSAL',
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

    async editPlano(id: number, data: { nome?: string, valorMensal?: number, frequencia?: 'SEMANAL' | 'QUINZENAL' | 'MENSAL', itens?: { itemId: number, quantidade: number }[] }) {
        const plano = await prisma.plano.findUnique({ where: { id } });
        if (!plano) throw new Error('Plano não encontrado');

        return prisma.plano.update({
            where: { id },
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                frequencia: data.frequencia,
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
        const proximoVencimento = this.calcularProximoVencimento(hoje, plano.frequencia);

        const novaAssinatura = await prisma.assinatura.create({
            data: {
                clienteId,
                planoId,
                status: statusAssinatura.ATIVA,
                diaVencimento: hoje.getDate(),
                dataProximoVencimento: proximoVencimento,
                dataUltimoPagamento: hoje,
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
                    descricao: `Pagamento/Adesão Plano: ${plano.nome}`,
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

    async renewSubscription(assinaturaId: number, profissionalIdParaTransacao: number) {
        const assinatura = await prisma.assinatura.findUnique({
            where: { id: assinaturaId },
            include: { plano: { include: { itens: true } } }
        });

        if (!assinatura) throw new Error('Assinatura não encontrada');
        if (assinatura.status !== statusAssinatura.ATIVA) throw new Error('Apenas assinaturas ativas podem ser renovadas');

        const hoje = new Date();
        // Se já venceu, calculamos a partir de hoje. Se ainda não venceu, estendemos a partir do vencimento atual.
        const baseCalculo = (assinatura.dataProximoVencimento && assinatura.dataProximoVencimento > hoje) 
            ? assinatura.dataProximoVencimento 
            : hoje;
            
        const novoVencimento = this.calcularProximoVencimento(baseCalculo, assinatura.plano.frequencia);

        const assinaturaAtualizada = await prisma.assinatura.update({
            where: { id: assinaturaId },
            data: {
                dataProximoVencimento: novoVencimento,
                dataUltimoPagamento: hoje,
                creditos: {
                    deleteMany: {},
                    create: assinatura.plano.itens.map(i => ({
                        itemId: i.itemId,
                        quantidadeRestante: i.quantidade
                    }))
                }
            },
            include: { creditos: true }
        });

        // Registra o pagamento da renovação
        try {
            await prisma.transacao.create({
                data: {
                    valorTotal: assinatura.plano.valorMensal,
                    descricao: `Renovação de Assinatura: ${assinatura.plano.nome}`,
                    clienteId: assinatura.clienteId,
                    profissionalId: profissionalIdParaTransacao,
                    tipoTransacaoId: 1 // ENTRADA
                }
            });
        } catch (err) {
            console.warn('Aviso: Assinatura renovada mas falhou ao registrar no caixa:', err);
        }

        return assinaturaAtualizada;
    }

    private calcularProximoVencimento(dataReferencia: Date, frequencia: string): Date {
        const data = new Date(dataReferencia);
        switch (frequencia) {
            case 'SEMANAL':
                data.setDate(data.getDate() + 7);
                break;
            case 'QUINZENAL':
                data.setDate(data.getDate() + 15);
                break;
            case 'MENSAL':
            default:
                data.setMonth(data.getMonth() + 1);
                break;
        }
        return data;
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
