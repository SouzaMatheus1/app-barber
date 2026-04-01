import { prisma } from '../database/prisma';
import { statusAssinatura } from '@prisma/client';

export class AssinaturaService {
    // Planos
    async createPlano(data: { nome: string, valorMensal: number, qtCortes: number, qtBarbas: number }) {
        return prisma.plano.create({
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                qtCortes: data.qtCortes,
                qtBarbas: data.qtBarbas,
                ativo: true
            }
        });
    }

    async getPlanos() {
        return prisma.plano.findMany({ where: { ativo: true } });
    }

    async editPlano(id: number, data: { nome?: string, valorMensal?: number, qtCortes?: number, qtBarbas?: number }) {
        const plano = await prisma.plano.findUnique({ where: { id } });
        if (!plano) throw new Error('Plano não encontrado');

        return prisma.plano.update({
            where: { id },
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                qtCortes: data.qtCortes,
                qtBarbas: data.qtBarbas
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
            // Se já tem assinatura ativa, inativa ela antes de criar a nova (troca de plano)
            await prisma.assinatura.update({
                where: { id: assinaturaAtiva.id },
                data: { status: statusAssinatura.INATIVA }
            });
        }

        const hoje = new Date();

        // Cria a assinatura primeiro (separado do registro de caixa)
        const novaAssinatura = await prisma.assinatura.create({
            data: {
                clienteId,
                planoId,
                status: statusAssinatura.ATIVA,
                creditosCorte: plano.qtCortes,
                creditosBarba: plano.qtBarbas,
                diaVencimento: hoje.getDate()
            }
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
