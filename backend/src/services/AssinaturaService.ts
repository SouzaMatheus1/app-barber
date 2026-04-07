import { prisma } from '../database/prisma';
import { statusAssinatura, TipoTransacao } from '@prisma/client';

export class AssinaturaService {
    // Planos
    async createPlano(data: { nome: string, valorMensal: number, qtCortes: number, qtBarbas: number }, barbeariaId: number) {
        return prisma.plano.create({
            data: {
                nome: data.nome,
                valorMensal: data.valorMensal,
                qtCortes: data.qtCortes,
                qtBarbas: data.qtBarbas,
                ativo: true,
                barbeariaId
            }
        });
    }

    async getPlanos(barbeariaId: number) {
        return prisma.plano.findMany({ 
            where: { ativo: true, barbeariaId } 
        });
    }

    async editPlano(id: number, data: { nome?: string, valorMensal?: number, qtCortes?: number, qtBarbas?: number }, barbeariaId: number) {
        const plano = await prisma.plano.findFirst({ 
            where: { id, barbeariaId } 
        });
        if (!plano) throw new Error('Plano não encontrado ou acesso negado');

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

    async deletePlano(id: number, barbeariaId: number) {
        const plano = await prisma.plano.findFirst({ 
            where: { id, barbeariaId } 
        });
        if (!plano) throw new Error('Plano não encontrado ou acesso negado');

        return prisma.plano.update({
            where: { id },
            data: {
                ativo: false
            }
        });
    }

    // Assinaturas
    async subscribe(clienteId: number, planoId: number, profissionalIdParaTransacao: number, barbeariaId: number) {
        const plano = await prisma.plano.findFirst({ 
            where: { id: planoId, barbeariaId } 
        });
        if (!plano) throw new Error('Plano não encontrado');

        const assinaturaAtiva = await prisma.assinatura.findFirst({
            where: { clienteId, status: statusAssinatura.ATIVA, barbeariaId }
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
                creditosCorte: plano.qtCortes,
                creditosBarba: plano.qtBarbas,
                diaVencimento: hoje.getDate(),
                barbeariaId
            }
        });

        try {
            await prisma.transacao.create({
                data: {
                    valorTotal: plano.valorMensal,
                    descricao: `Pagamento/Renovação Plano: ${plano.nome}`,
                    clienteId,
                    profissionalId: profissionalIdParaTransacao,
                    tipo: TipoTransacao.ENTRADA,
                    barbeariaId
                }
            });
        } catch (err) {
            console.warn('Aviso: Assinatura criada mas falhou ao registrar no caixa:', err);
        }

        return novaAssinatura;
    }

    async getAssinaturaAtivaByClienteId(clienteId: number, barbeariaId: number) {
        return prisma.assinatura.findFirst({
            where: { clienteId, barbeariaId },
            orderBy: { id: 'desc' },
            include: { plano: true }
        });
    }

    async getAssinaturas(barbeariaId: number) {
        return prisma.assinatura.findMany({
            where: { barbeariaId },
            include: { cliente: true, plano: true }
        });
    }
}
