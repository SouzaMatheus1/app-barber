import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';
import { AppError } from '../utils/AppError';

interface CriarChangelogInput {
  titulo: string;
  descricao: string;
  tipoEmpresaId?: number;
}

export class ChangelogService {
  private async getEmpresaAtual() {
    const store = tenantStorage.getStore();
    if (!store?.empresaId) {
      throw new AppError('Contexto de empresa não encontrado.', 400);
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: store.empresaId }
    });

    if (!empresa) {
      throw new AppError('Empresa não encontrada.', 404);
    }

    return empresa;
  }

  async criar(dados: CriarChangelogInput) {
    if (!dados.titulo || !dados.descricao) {
      throw new AppError('Os campos titulo e descricao são obrigatórios.', 400);
    }

    return await prisma.changelogEntry.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipoEmpresaId: dados.tipoEmpresaId ?? null
      }
    });
  }

  async listarParaTenant() {
    const empresa = await this.getEmpresaAtual();

    return await prisma.changelogEntry.findMany({
      where: {
        OR: [
          { tipoEmpresaId: null },
          { tipoEmpresaId: empresa.tipoEmpresaId }
        ]
      },
      orderBy: { publicadoEm: 'desc' }
    });
  }

  async contarNaoLidas() {
    const empresa = await this.getEmpresaAtual();

    const entradas = await prisma.changelogEntry.findMany({
      where: {
        OR: [
          { tipoEmpresaId: null },
          { tipoEmpresaId: empresa.tipoEmpresaId }
        ]
      }
    });

    if (!empresa.changelogVisualizadoEm) {
      return { total: entradas.length };
    }

    const visualizadoEm = empresa.changelogVisualizadoEm;
    const total = entradas.filter(e => e.publicadoEm > visualizadoEm).length;
    return { total };
  }

  async marcarComoVisualizado() {
    const empresa = await this.getEmpresaAtual();

    await prisma.empresa.update({
      where: { id: empresa.id },
      data: { changelogVisualizadoEm: new Date() }
    });

    return { message: 'Changelog marcado como visualizado.' };
  }
}
