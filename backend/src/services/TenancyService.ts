import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { Perfil } from '@prisma/client';

export class TenancyService {
    async createTenant(data: {
        nomeBarbearia: string,
        cnpj?: string,
        descricao?: string,
        nomeAdmin: string,
        emailAdmin: string,
        senhaAdmin: string
    }) {
        const { nomeBarbearia, cnpj, descricao, nomeAdmin, emailAdmin, senhaAdmin } = data;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Criar a Barbearia
            const barbearia = await tx.barbearia.create({
                data: {
                    nome: nomeBarbearia,
                    cnpj,
                    descricao,
                    status: 'ATIVO'
                }
            });

            // 2. Criar o usuário TENANT_ADMIN
            const senhaHash = await bcrypt.hash(senhaAdmin, 10);
            const admin = await tx.profissional.create({
                data: {
                    nome: nomeAdmin,
                    email: emailAdmin,
                    senha: senhaHash,
                    perfil: Perfil.TENANT_ADMIN,
                    barbeariaId: barbearia.id
                }
            });

            return { barbearia, admin };
        });

        return result;
    }

    async listTenants() {
        return await prisma.barbearia.findMany({
            include: {
                _count: {
                    select: { profissionais: true, clientes: true }
                }
            }
        });
    }
}
