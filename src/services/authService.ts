import { prisma } from '../database/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export class AuthService {
    async login(email: string, senhaPlana: string) {
        // Traz o profissional e o perfil dele junto
        const profissional = await prisma.profissional.findUnique({
            where: { email },
            include: { perfil: true } 
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
                perfil: perfilProfissional 
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        return {
            token,
            profissional: {
                id: profissional.id,
                nome: profissional.nome,
                perfil: perfilProfissional
            }
        };
    }
}