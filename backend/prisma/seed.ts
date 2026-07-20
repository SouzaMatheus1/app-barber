import { prisma } from '../src/database/prisma';
import bcrypt from 'bcryptjs';
import { tenantStorage } from '../src/database/tenantContext';

async function main() {
  console.log('Iniciando o seeding global...');

  // --- 1. TABELAS DICIONÁRIO / GLOBAIS ---
  const perfilAdmin = await prisma.perfil.upsert({
    where: { descricao: 'ADMIN' },
    update: {},
    create: { descricao: 'ADMIN' },
  });

  const perfilProfissional = await prisma.perfil.upsert({
    where: { descricao: 'ATENDENTE' },
    update: {},
    create: { descricao: 'ATENDENTE' },
  });

  const tipoServico = await prisma.tipoItem.upsert({
    where: { descricao: 'SERVICO' },
    update: {},
    create: { descricao: 'SERVICO' },
  });

  const tipoProduto = await prisma.tipoItem.upsert({
    where: { descricao: 'PRODUTO' },
    update: {},
    create: { descricao: 'PRODUTO' },
  });

  const tipoEntrada = await prisma.tipoTransacao.upsert({
    where: { descricao: 'ENTRADA' },
    update: {},
    create: { descricao: 'ENTRADA' },
  });

  const tipoSaida = await prisma.tipoTransacao.upsert({
    where: { descricao: 'SAIDA' },
    update: {},
    create: { descricao: 'SAIDA' },
  });

  await prisma.metodoPagamento.createMany({
    data: [
      { id: 1, descricao: 'PIX' },
      { id: 2, descricao: 'Cartão de Crédito' },
      { id: 3, descricao: 'Cartão de Débito' },
      { id: 4, descricao: 'Dinheiro' }
    ],
    skipDuplicates: true
  });

  console.log('Populando CategoriaVeiculo...');
  const catCarro = await prisma.categoriaVeiculo.upsert({
    where: { descricao: 'CARRO' },
    update: {},
    create: { descricao: 'CARRO' },
  });
  await prisma.categoriaVeiculo.upsert({
    where: { descricao: 'MOTO' },
    update: {},
    create: { descricao: 'MOTO' },
  });
  await prisma.categoriaVeiculo.upsert({
    where: { descricao: 'CAMINHAO' },
    update: {},
    create: { descricao: 'CAMINHAO' },
  });

  console.log('Populando EspecieAnimal...');
  const espCachorro = await prisma.especieAnimal.upsert({
    where: { descricao: 'CACHORRO' },
    update: {},
    create: { descricao: 'CACHORRO' },
  });
  await prisma.especieAnimal.upsert({
    where: { descricao: 'GATO' },
    update: {},
    create: { descricao: 'GATO' },
  });
  await prisma.especieAnimal.upsert({
    where: { descricao: 'AVE' },
    update: {},
    create: { descricao: 'AVE' },
  });
  await prisma.especieAnimal.upsert({
    where: { descricao: 'OUTROS' },
    update: {},
    create: { descricao: 'OUTROS' },
  });

  // --- 2. MULTI-VERTICAL DICTIONARY ---
  console.log('Populando TipoAtivo...');
  const tipoVeiculo = await prisma.tipoAtivo.upsert({
    where: { chave: 'veiculo' },
    update: {},
    create: { id: 1, chave: 'veiculo', descricao: 'Veículo' },
  });

  const tipoAnimal = await prisma.tipoAtivo.upsert({
    where: { chave: 'animal' },
    update: {},
    create: { id: 2, chave: 'animal', descricao: 'Animal de Estimação' },
  });

  console.log('Populando TipoEmpresa...');
  const tipoBarbearia = await prisma.tipoEmpresa.upsert({
    where: { descricao: 'Barbearia' },
    update: {},
    create: { id: 1, descricao: 'Barbearia' },
  });

  const tipoLavaRapido = await prisma.tipoEmpresa.upsert({
    where: { descricao: 'Lava Rápido' },
    update: {},
    create: { id: 2, descricao: 'Lava Rápido' },
  });

  const tipoPetShop = await prisma.tipoEmpresa.upsert({
    where: { descricao: 'Pet Shop' },
    update: {},
    create: { id: 3, descricao: 'Pet Shop' },
  });

  console.log('Associando ativos aos tipos de empresa...');
  await prisma.tipoEmpresaAtivo.upsert({
    where: {
      tipoEmpresaId_tipoAtivoId: {
        tipoEmpresaId: tipoLavaRapido.id,
        tipoAtivoId: tipoVeiculo.id,
      },
    },
    update: {},
    create: {
      tipoEmpresaId: tipoLavaRapido.id,
      tipoAtivoId: tipoVeiculo.id,
    },
  });

  await prisma.tipoEmpresaAtivo.upsert({
    where: {
      tipoEmpresaId_tipoAtivoId: {
        tipoEmpresaId: tipoPetShop.id,
        tipoAtivoId: tipoAnimal.id,
      },
    },
    update: {},
    create: {
      tipoEmpresaId: tipoPetShop.id,
      tipoAtivoId: tipoAnimal.id,
    },
  });

  // --- 3. CRIANDO EMPRESAS ---
  console.log('Populando Empresas...');
  await prisma.empresa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomeFantasia: 'Barbearia Premium',
      slug: 'barbearia',
      tipoEmpresaId: tipoBarbearia.id,
    },
  });

  await prisma.empresa.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nomeFantasia: 'Lava Rápido Brilho Estrela',
      slug: 'lava-rapido',
      tipoEmpresaId: tipoLavaRapido.id,
    },
  });

  await prisma.empresa.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nomeFantasia: 'Pet Shop Fofura',
      slug: 'pet-shop',
      tipoEmpresaId: tipoPetShop.id,
    },
  });

  // --- 4. SEEDING DOS DADOS ESPECÍFICOS DE CADA TENANT ---
  const senhaHash = await bcrypt.hash('admin123', 10);

  // --- TENANT 1: Barbearia ---
  console.log('Seeding Barbearia...');
  await tenantStorage.run({ empresaId: 1 }, async () => {
    const admin = await prisma.profissional.upsert({
      where: { email: 'admin@barbearia.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Administrador Barbearia',
        email: 'admin@barbearia.com',
        senha: senhaHash,
        perfilId: perfilAdmin.id,
      },
    });

    const profissional1 = await prisma.profissional.upsert({
      where: { email: 'barbeiro1@barbearia.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Thiago Barbeiro',
        email: 'barbeiro1@barbearia.com',
        senha: senhaHash,
        perfilId: perfilProfissional.id,
      },
    });

    const cliente1 = await prisma.cliente.create({
      data: { nome: 'Carlos Eduardo', telefone: '11999999999' },
    });

    const corteCabelo = await prisma.itemCatalogo.create({
      data: {
        nome: 'Corte Degradê',
        preco: 45.00,
        comissao: 50.00,
        tipoItemId: tipoServico.id,
      },
    });

    const barbaComToalha = await prisma.itemCatalogo.create({
      data: {
        nome: 'Barba Terapia',
        preco: 35.00,
        comissao: 40.00,
        tipoItemId: tipoServico.id,
      },
    });
  });

  // --- TENANT 2: Lava Rápido ---
  console.log('Seeding Lava Rápido...');
  await tenantStorage.run({ empresaId: 2 }, async () => {
    const admin = await prisma.profissional.upsert({
      where: { email: 'admin@lavarapido.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Gerente Lava Rápido',
        email: 'admin@lavarapido.com',
        senha: senhaHash,
        perfilId: perfilAdmin.id,
      },
    });

    const profissional1 = await prisma.profissional.upsert({
      where: { email: 'lavador1@lavarapido.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Marcos Lavador',
        email: 'lavador1@lavarapido.com',
        senha: senhaHash,
        perfilId: perfilProfissional.id,
      },
    });

    // Criar cliente de exemplo para o Lava Rápido
    const clienteLR = await prisma.cliente.create({
      data: { nome: 'Felipe Veículos', telefone: '11988888888' },
    });

    // Cadastrar ativo veículo
    const ativoLR = await prisma.ativo.create({
      data: {
        clienteId: clienteLR.id,
        tipoAtivoId: tipoVeiculo.id,
        nome: 'Corolla Preto',
        empresaId: 2,
      }
    });

    await prisma.ativoVeiculo.create({
      data: {
        ativoId: ativoLR.id,
        modelo: 'Corolla',
        categoriaId: catCarro.id,
        placa: 'XYZ-9876',
        cor: 'Preto',
        ano: 2022
      }
    });

    const lavagemSimples = await prisma.itemCatalogo.create({
      data: {
        nome: 'Lavagem Simples',
        preco: 50.00,
        comissao: 30.00,
        tipoItemId: tipoServico.id,
      },
    });

    const lavagemCompleta = await prisma.itemCatalogo.create({
      data: {
        nome: 'Lavagem Completa + Cera',
        preco: 90.00,
        comissao: 30.00,
        tipoItemId: tipoServico.id,
      },
    });
  });

  // --- TENANT 3: Pet Shop ---
  console.log('Seeding Pet Shop...');
  await tenantStorage.run({ empresaId: 3 }, async () => {
    const admin = await prisma.profissional.upsert({
      where: { email: 'admin@petshop.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Gerente Pet Shop',
        email: 'admin@petshop.com',
        senha: senhaHash,
        perfilId: perfilAdmin.id,
      },
    });

    const profissional1 = await prisma.profissional.upsert({
      where: { email: 'tosador1@petshop.com' },
      update: { senha: senhaHash },
      create: {
        nome: 'Ana Tosadora',
        email: 'tosador1@petshop.com',
        senha: senhaHash,
        perfilId: perfilProfissional.id,
      },
    });

    const clientePet = await prisma.cliente.create({
      data: { nome: 'Juliana Pets', telefone: '11977777777' },
    });

    const ativoPet = await prisma.ativo.create({
      data: {
        clienteId: clientePet.id,
        tipoAtivoId: tipoAnimal.id,
        nome: 'Mel',
        empresaId: 3,
      }
    });

    await prisma.ativoAnimal.create({
      data: {
        ativoId: ativoPet.id,
        especieId: espCachorro.id,
        raca: 'Golden Retriever',
        porte: 'Grande'
      }
    });

    const banho = await prisma.itemCatalogo.create({
      data: {
        nome: 'Banho',
        preco: 60.00,
        comissao: 40.00,
        tipoItemId: tipoServico.id,
      },
    });

    const tosa = await prisma.itemCatalogo.create({
      data: {
        nome: 'Tosa Higiênica',
        preco: 40.00,
        comissao: 40.00,
        tipoItemId: tipoServico.id,
      },
    });
  });

  console.log('\n✅ Seeding completo e concluído com sucesso!');
  console.log('--------------------------------------------------');
  console.log(' Credenciais de Teste Geradas:');
  console.log(' 1. Barbearia (http://localhost:5173/portal/barbearia)');
  console.log('    Login Admin Painel: admin@barbearia.com / admin123');
  console.log(' 2. Lava Rápido (http://localhost:5173/portal/lava-rapido)');
  console.log('    Login Admin Painel: admin@lavarapido.com / admin123');
  console.log(' 3. Pet Shop (http://localhost:5173/portal/pet-shop)');
  console.log('    Login Admin Painel: admin@petshop.com / admin123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Erro no seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
