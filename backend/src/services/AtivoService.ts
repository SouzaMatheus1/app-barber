import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

interface CriarAtivoInput {
  clienteId: number;
  tipoAtivoId: number;
  nome: string;
  detalhesVeiculo?: {
    modelo: string;
    ano?: number;
    cor?: string;
    placa?: string;
  };
  detalhesAnimal?: {
    especie: string;
    raca?: string;
    porte?: string;
  };
}

interface AtualizarAtivoInput {
  nome?: string;
  detalhesVeiculo?: {
    modelo: string;
    ano?: number;
    cor?: string;
    placa?: string;
  };
  detalhesAnimal?: {
    especie: string;
    raca?: string;
    porte?: string;
  };
}

export class AtivoService {
  async criar(dados: CriarAtivoInput) {
    const store = tenantStorage.getStore();
    if (!store?.empresaId) {
      throw new Error('Contexto de empresa não encontrado.');
    }

    // 1. Validar empresa e tipoEmpresaId
    const empresa = await prisma.empresa.findUnique({
      where: { id: store.empresaId }
    });
    if (!empresa) {
      throw new Error('Empresa não encontrada.');
    }

    // 2. Validar que tipoAtivoId está autorizado para o tipoEmpresaId do tenant atual
    const tipoEmpresaAtivo = await prisma.tipoEmpresaAtivo.findFirst({
      where: {
        tipoEmpresaId: empresa.tipoEmpresaId,
        tipoAtivoId: dados.tipoAtivoId
      }
    });

    if (!tipoEmpresaAtivo) {
      throw new Error('Tipo de ativo não permitido para esta empresa.');
    }

    // 3. Validar se o cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: dados.clienteId }
    });
    if (!cliente) {
      throw new Error('Cliente não encontrado.');
    }

    // 4. Salvar dentro de uma transação
    return await prisma.$transaction(async (tx) => {
      const novoAtivo = await tx.ativo.create({
        data: {
          clienteId: dados.clienteId,
          tipoAtivoId: dados.tipoAtivoId,
          nome: dados.nome,
          empresaId: store.empresaId,
        }
      });

      if (dados.detalhesVeiculo) {
        await tx.ativoVeiculo.create({
          data: {
            ativoId: novoAtivo.id,
            modelo: dados.detalhesVeiculo.modelo,
            ano: dados.detalhesVeiculo.ano,
            cor: dados.detalhesVeiculo.cor,
            placa: dados.detalhesVeiculo.placa
          }
        });
      } else if (dados.detalhesAnimal) {
        await tx.ativoAnimal.create({
          data: {
            ativoId: novoAtivo.id,
            especie: dados.detalhesAnimal.especie,
            raca: dados.detalhesAnimal.raca,
            porte: dados.detalhesAnimal.porte
          }
        });
      }

      return await tx.ativo.findUnique({
        where: { id: novoAtivo.id },
        include: { veiculo: true, animal: true }
      });
    });
  }

  async listarPorCliente(clienteId: number) {
    return await prisma.ativo.findMany({
      where: {
        clienteId,
        ativo: true
      },
      include: {
        veiculo: true,
        animal: true
      }
    });
  }

  async atualizar(id: number, dados: AtualizarAtivoInput) {
    const ativo = await prisma.ativo.findUnique({
      where: { id },
      include: { veiculo: true, animal: true }
    });

    if (!ativo) {
      throw new Error('Ativo não encontrado.');
    }

    return await prisma.$transaction(async (tx) => {
      await tx.ativo.update({
        where: { id },
        data: {
          nome: dados.nome
        }
      });

      if (dados.detalhesVeiculo && ativo.veiculo) {
        await tx.ativoVeiculo.update({
          where: { ativoId: id },
          data: {
            modelo: dados.detalhesVeiculo.modelo,
            ano: dados.detalhesVeiculo.ano,
            cor: dados.detalhesVeiculo.cor,
            placa: dados.detalhesVeiculo.placa
          }
        });
      } else if (dados.detalhesAnimal && ativo.animal) {
        await tx.ativoAnimal.update({
          where: { ativoId: id },
          data: {
            especie: dados.detalhesAnimal.especie,
            raca: dados.detalhesAnimal.raca,
            porte: dados.detalhesAnimal.porte
          }
        });
      }

      return await tx.ativo.findUnique({
        where: { id },
        include: { veiculo: true, animal: true }
      });
    });
  }

  async desativar(id: number) {
    const ativo = await prisma.ativo.findUnique({
      where: { id }
    });

    if (!ativo) {
      throw new Error('Ativo não encontrado.');
    }

    await prisma.ativo.update({
      where: { id },
      data: { ativo: false }
    });

    return { message: 'Ativo desativado com sucesso.' };
  }

  async listarTiposPermitidos() {
    const store = tenantStorage.getStore();
    if (!store?.empresaId) {
      throw new Error('Contexto de empresa não encontrado.');
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: store.empresaId }
    });
    if (!empresa) {
      throw new Error('Empresa não encontrada.');
    }

    const tipos = await prisma.tipoEmpresaAtivo.findMany({
      where: {
        tipoEmpresaId: empresa.tipoEmpresaId
      },
      include: {
        tipoAtivo: true
      }
    });

    return tipos.map(t => t.tipoAtivo);
  }
}
