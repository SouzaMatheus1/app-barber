import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';

interface CriarAtivoInput {
  clienteId: number;
  tipoAtivoId: number;
  nome: string;
  detalhesVeiculo?: {
    modelo: string;
    categoria: string;
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
    categoria?: string;
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

    // 4. Validar e normalizar subcategorias
    if (dados.detalhesVeiculo) {
      const cat = dados.detalhesVeiculo.categoria?.toUpperCase();
      if (!cat || !['CARRO', 'MOTO', 'CAMINHAO'].includes(cat)) {
        throw new Error('Categoria de veículo inválida. Opções: CARRO, MOTO, CAMINHAO.');
      }
      dados.detalhesVeiculo.categoria = cat;
    }

    if (dados.detalhesAnimal) {
      const esp = dados.detalhesAnimal.especie?.toUpperCase();
      if (!esp || !['CACHORRO', 'GATO', 'AVE', 'OUTROS'].includes(esp)) {
        throw new Error('Espécie de animal inválida. Opções: CACHORRO, GATO, AVE, OUTROS.');
      }
      dados.detalhesAnimal.especie = esp;
    }

    // 5. Salvar dentro de uma transação
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
            categoria: dados.detalhesVeiculo.categoria,
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

    // Validar e normalizar subcategorias para atualização
    let validatedCategory: string | undefined;
    if (dados.detalhesVeiculo && ativo.veiculo) {
      const cat = dados.detalhesVeiculo.categoria?.toUpperCase();
      if (cat) {
        if (!['CARRO', 'MOTO', 'CAMINHAO'].includes(cat)) {
          throw new Error('Categoria de veículo inválida. Opções: CARRO, MOTO, CAMINHAO.');
        }
        validatedCategory = cat;
      }
    }

    let validatedEspecie: string | undefined;
    if (dados.detalhesAnimal && ativo.animal) {
      const esp = dados.detalhesAnimal.especie?.toUpperCase();
      if (esp) {
        if (!['CACHORRO', 'GATO', 'AVE', 'OUTROS'].includes(esp)) {
          throw new Error('Espécie de animal inválida. Opções: CACHORRO, GATO, AVE, OUTROS.');
        }
        validatedEspecie = esp;
      }
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
            categoria: validatedCategory || ativo.veiculo.categoria,
            ano: dados.detalhesVeiculo.ano,
            cor: dados.detalhesVeiculo.cor,
            placa: dados.detalhesVeiculo.placa
          }
        });
      } else if (dados.detalhesAnimal && ativo.animal) {
        await tx.ativoAnimal.update({
          where: { ativoId: id },
          data: {
            especie: validatedEspecie || ativo.animal.especie,
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
