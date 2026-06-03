import { prisma, systemPrisma } from '../database/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export class AuthService {
    async login(email: string, senhaPlana: string) {
        // Traz o profissional, perfil e empresa (com tipo) junto usando systemPrisma para busca global de login
        const profissional = await systemPrisma.profissional.findFirst({
            where: { email, ativo: true },
            include: { 
                perfil: true, 
                empresa: {
                    include: { tipo: true }
                } 
            }
        });

        if (!profissional)
            throw new Error('Email ou senha incorretos');

        const senhaBate = await compare(senhaPlana, profissional.senha);
        if (!senhaBate)
            throw new Error('Email ou senha incorretos');

        const perfilProfissional = profissional.perfil.descricao.toUpperCase();

        const token = sign(
            { 
                id: profissional.id, 
                perfil: perfilProfissional,
                empresaId: profissional.empresaId
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        return {
            token,
            profissional: {
                id: profissional.id,
                nome: profissional.nome,
                perfil: perfilProfissional,
                empresaId: profissional.empresaId,
                nomeFantasia: profissional.empresa?.nomeFantasia || 'λ MAT',
                slug: profissional.empresa?.slug,
                tipoEmpresa: profissional.empresa?.tipo?.descricao || 'empresa'
            }
        };
    }
}