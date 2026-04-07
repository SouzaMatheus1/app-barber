import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  console.log('🚀 Iniciando seed de administradores...');

  // 1. Garante que a Barbearia Matriz (ID 1) existe
  const barbearia = await prisma.barbearia.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: 'Barbearia Matriz System',
      cnpj: '00.000.000/0001-00',
      status: 'ATIVO'
    }
  });

  // 2. Criar SUPER_ADMIN (Gestor do Sistema)
  const superAdmin = await prisma.profissional.upsert({
    where: { email: 'super@sistema.com' },
    update: {},
    create: {
      nome: 'Super Administrador',
      email: 'super@sistema.com',
      senha: senhaHash,
      perfil: Perfil.SUPER_ADMIN,
      barbeariaId: barbearia.id
    }
  });
  console.log('✅ Super Admin criado: super@sistema.com');

  // 3. Criar TENANT_ADMIN (Gestor da Unidade)
  const tenantAdmin = await prisma.profissional.upsert({
    where: { email: 'gerente@barbearia.com' },
    update: {},
    create: {
      nome: 'Gerente Matriz',
      email: 'gerente@barbearia.com',
      senha: senhaHash,
      perfil: Perfil.TENANT_ADMIN,
      barbeariaId: barbearia.id
    }
  });
  console.log('✅ Tenant Admin criado: gerente@barbearia.com');

  // 4. Criar um BARBEIRO comum para testes
  const barbeiro = await prisma.profissional.upsert({
    where: { email: 'barbeiro@barbearia.com' },
    update: {},
    create: {
      nome: 'Barbeiro Teste',
      email: 'barbeiro@barbearia.com',
      senha: senhaHash,
      perfil: Perfil.BARBEIRO,
      barbeariaId: barbearia.id
    }
  });
  console.log('✅ Barbeiro criado: barbeiro@barbearia.com');

  console.log('✨ Seed finalizado com sucesso! Senha padrão para todos: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
