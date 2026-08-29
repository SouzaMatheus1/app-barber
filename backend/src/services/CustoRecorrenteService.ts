import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';
import { TransacaoService } from './TransacaoService';

export class CustoRecorrenteService {
    private transacaoService = new TransacaoService();

    private calcularProximoVencimento(diaVencimento: number, referencia: Date = new Date()): Date {
        const data = new Date(referencia.getFullYear(), referencia.getMonth(), diaVencimento);
        if (data <= referencia) {
            data.setMonth(data.getMonth() + 1);
        }
        return data;
    }

    async listar() {
        return prisma.custoRecorrente.findMany({
            where: { ativo: true },
            include: { categoriaCusto: true },
            orderBy: { diaVencimento: 'asc' }
        });
    }

    async criar(data: { descricao: string, valor: number, diaVencimento: number, categoriaCustoId?: number }) {
        if (data.diaVencimento < 1 || data.diaVencimento > 28) {
            throw new AppError("O dia de vencimento deve ser entre 1 e 28.", 400);
        }

        return prisma.custoRecorrente.create({
            data: {
                descricao: data.descricao,
                valor: data.valor,
                diaVencimento: data.diaVencimento,
                categoriaCustoId: data.categoriaCustoId || null,
                dataProximoVencimento: this.calcularProximoVencimento(data.diaVencimento)
            },
            include: { categoriaCusto: true }
        });
    }

    async editar(id: number, data: { descricao?: string, valor?: number, diaVencimento?: number, categoriaCustoId?: number }) {
        const custo = await prisma.custoRecorrente.findUnique({ where: { id } });
        if (!custo) throw new AppError('Custo recorrente não encontrado', 404);

        if (data.diaVencimento !== undefined && (data.diaVencimento < 1 || data.diaVencimento > 28)) {
            throw new AppError("O dia de vencimento deve ser entre 1 e 28.", 400);
        }

        return prisma.custoRecorrente.update({
            where: { id },
            data: {
                ...(data.descricao !== undefined && { descricao: data.descricao }),
                ...(data.valor !== undefined && { valor: data.valor }),
                ...(data.categoriaCustoId !== undefined && { categoriaCustoId: data.categoriaCustoId || null }),
                ...(data.diaVencimento !== undefined && {
                    diaVencimento: data.diaVencimento,
                    dataProximoVencimento: this.calcularProximoVencimento(data.diaVencimento)
                })
            },
            include: { categoriaCusto: true }
        });
    }

    async deletar(id: number) {
        const custo = await prisma.custoRecorrente.findUnique({ where: { id } });
        if (!custo) throw new AppError('Custo recorrente não encontrado', 404);

        await prisma.custoRecorrente.update({
            where: { id },
            data: { ativo: false }
        });

        return { message: 'Custo recorrente excluído com sucesso' };
    }

    async lancarPagamento(id: number) {
        const custo = await prisma.custoRecorrente.findUnique({ where: { id } });
        if (!custo) throw new AppError('Custo recorrente não encontrado', 404);

        await this.transacaoService.create({
            tipoTransacaoId: 2, // SAIDA
            descricao: `Custo recorrente: ${custo.descricao}`,
            categoriaCustoId: custo.categoriaCustoId || undefined,
            valorTotal: Number(custo.valor)
        });

        const hoje = new Date();
        const baseCalculo = (custo.dataProximoVencimento && custo.dataProximoVencimento > hoje)
            ? custo.dataProximoVencimento
            : hoje;

        return prisma.custoRecorrente.update({
            where: { id },
            data: {
                dataUltimoPagamento: hoje,
                dataProximoVencimento: this.calcularProximoVencimento(custo.diaVencimento, baseCalculo)
            },
            include: { categoriaCusto: true }
        });
    }
}
