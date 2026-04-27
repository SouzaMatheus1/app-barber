import { prisma } from '../database/prisma';

export class CategoriaCustoService {
    async listar() {
        return prisma.categoriaCusto.findMany({
            orderBy: { descricao: 'asc' }
        });
    }

    async criar(descricao: string) {
        return prisma.categoriaCusto.create({
            data: { descricao }
        });
    }

    async editar(id: number, descricao: string) {
        return prisma.categoriaCusto.update({
            where: { id },
            data: { descricao }
        });
    }

    async deletar(id: number) {
        return prisma.categoriaCusto.delete({
            where: { id }
        });
    }
}
