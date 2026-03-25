import { prisma } from '../src/database/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // --- TABELAS BASE (Não dependem de ninguém) ---
  console.log('Populando Perfis e Tipos...');
  const perfilAdmin = await prisma.perfil.upsert({
    where: { descricao: 'ADMIN' },
    update: {},
    create: { descricao: 'ADMIN' },
  });

  const perfilBarbeiro = await prisma.perfil.upsert({
    where: { descricao: 'BARBEIRO' },
    update: {},
    create: { descricao: 'BARBEIRO' },
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

  // --- TABELAS NÍVEL 1 ---
  console.log('Criando Profissionais e Clientes...');
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.profissional.upsert({
    where: { email: 'admin@barbearia.com' },
    update: { senha: senhaHash }, // Forçamos reset de senha pra ambiente demo
    create: {
      nome: 'Administrador Master',
      email: 'admin@barbearia.com',
      senha: senhaHash,
      perfilId: perfilAdmin.id,
    },
  });

  const barbeiro1 = await prisma.profissional.upsert({
    where: { email: 'barbeiro1@barbearia.com' },
    update: { senha: senhaHash },
    create: {
      nome: 'João Barbeiro',
      email: 'barbeiro1@barbearia.com',
      senha: senhaHash,
      perfilId: perfilBarbeiro.id,
    },
  });

  // Criaremos clientes com create pois caso não tenham um field UNIQUE fácil, criaremos amostras novas
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Carlos Eduardo',
      telefone: '11999999999',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Matheus Souza',
      telefone: '11988888888',
    },
  });

  console.log('Criando Catálogo de Serviços/Produtos...');
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

  const pomadaMatte = await prisma.itemCatalogo.create({
    data: {
      nome: 'Pomada Modeladora Matte',
      preco: 50.00,
      comissao: 10.00,
      tipoItemId: tipoProduto.id,
    },
  });

  // --- TABELAS NÍVEL 2 e 3 (Transações) ---
  console.log('Gerando transações de exemplo para o dashboard...');

  await prisma.transacao.create({
    data: {
      descricao: 'Serviço de Corte + Barba',
      valorTotal: 80.00,
      tipoTransacaoId: tipoEntrada.id,
      profissionalId: barbeiro1.id,
      clienteId: cliente1.id,
      itens: {
        create: [
          {
            itemId: corteCabelo.id,
            quantidade: 1,
            precoUnitario: 45.00,
          },
          {
            itemId: barbaComToalha.id,
            quantidade: 1,
            precoUnitario: 35.00,
          }
        ]
      }
    }
  });

  await prisma.transacao.create({
    data: {
      descricao: 'Venda de Pomada',
      valorTotal: 50.00,
      tipoTransacaoId: tipoEntrada.id,
      profissionalId: admin.id,
      clienteId: cliente2.id,
      itens: {
        create: [
          {
            itemId: pomadaMatte.id,
            quantidade: 1,
            precoUnitario: 50.00,
          }
        ]
      }
    }
  });

  console.log('\n✅ Seeding concluído com sucesso!');
  console.log('-------------------------------------------');
  console.log(' Credenciais de Teste Geradas (Profissional)');
  console.log(' Login: admin@barbearia.com');
  console.log(' Senha: admin123');
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Erro no seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
