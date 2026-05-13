import { prisma } from '../database/prisma';

export class FinanceiroService {
    async getFluxoCaixa(dataInicial: Date, dataFinal: Date) {
        const fechamentos = await prisma.fechamentoCaixa.findMany({
            where: {
                data: {
                    gte: dataInicial,
                    lte: dataFinal
                }
            },
            orderBy: {
                data: 'asc'
            }
        });

        return fechamentos;
    }
}
