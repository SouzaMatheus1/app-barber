import { prisma } from '../database/prisma';
import { statusAssinatura } from '@prisma/client';

export class AssinaturaService {
    // Planos
    async createPlano(data: { nome: string, valorMensal: number, qtCortes: number, qtBarbas: number, qtCombos: number }) {
        return prisma.plano.create({
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                qtCortes: data.qtCortes,
                qtBarbas: data.qtBarbas,
                qtCombos: data.qtCombos,
                ativo: true
            }
        });
    }

    async getPlanos() {
        return prisma.plano.findMany({ where: { ativo: true } });
    }

    async editPlano(id: number, data: { nome?: string, valorMensal?: number, qtCortes?: number, qtBarbas?: number, qtCombos?: number }) {
        const plano = await prisma.plano.findUnique({ where: { id } });
        if (!plano) throw new Error('Plano não encontrado');

        return prisma.plano.update({
            where: { id },
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                qtCortes: data.qtCortes,
                qtBarbas: data.qtBarbas,
                qtCombos: data.qtCombos
            }
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
        const plano = await prisma.plano.findUnique({ where: { id: planoId } });
        if (!plano) throw new Error('Plano não encontrado');

        const assinaturaAtiva = await prisma.assinatura.findFirst({
            where: { clienteId, status: statusAssinatura.ATIVA }
        });

        if (assinaturaAtiva) {
            throw new Error('Cliente já possui uma assinatura ativa. Por favor verifique.');
        }

        const hoje = new Date();
        const assinatura = await prisma.$transaction(async (tx) => {
            const novaAssinatura = await tx.assinatura.create({
                data: {
                    clienteId,
                    planoId,
                    status: statusAssinatura.ATIVA,
                    creditosCorte: plano.qtCortes,
                    creditosBarba: plano.qtBarbas,
                    creditosCombo: plano.qtCombos,
                    diaVencimento: hoje.getDate()
                }
            });

            // Registrar pagamento no caixa automaticamente
            await tx.transacao.create({
                data: {
                    valorTotal: plano.valorMensal,
                    descricao: `Pagamento/Renovação Plano de Assinatura: ${plano.nome}`,
                    clienteId,
                    profissionalId: profissionalIdParaTransacao,
                    tipoTransacaoId: 1 // 1 equivale a ENTRADA
                }
            });

            return novaAssinatura;
        });

        return assinatura;
    }

    async getAssinaturaAtivaByClienteId(clienteId: number) {
        return prisma.assinatura.findFirst({
            where: { clienteId, status: statusAssinatura.ATIVA },
            include: { plano: true }
        });
    }

    async getAssinaturas() {
        return prisma.assinatura.findMany({
            include: { cliente: true, plano: true }
        });
    }
}
