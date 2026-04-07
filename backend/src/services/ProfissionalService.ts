import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { Perfil } from '@prisma/client';

export class ProfissionalService {
    async listAll(barbeariaId: number) {
        const profissionais = await prisma.profissional.findMany({
            where: { barbeariaId },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true, 
                criadoEm: true
            }
        });

        return profissionais;
    }

    async create(data: any, barbeariaId: number) {
        const { nome, email, senha, perfil } = data;

        const profissionalCadastrado = await prisma.profissional.findUnique({
            where: { email }
        });

        if (profissionalCadastrado)
            throw new Error('E-mail já cadastrado');

        // hash da senha
        const senhaHash = await bcrypt.hash(senha, 8);

        const profissional = await prisma.profissional.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                perfil: perfil as Perfil || Perfil.BARBEIRO,
                barbeariaId
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true
            }
        });

        return profissional;
    }

    async edit(id: number, data: any, barbeariaId: number) {
        const { nome, email, senha, perfil } = data;

        const profissional = await prisma.profissional.findFirst({
            where: { id, barbeariaId }
        });

        if(!profissional)
            throw new Error('Usuário não encontrado ou acesso negado');

        if(email) {
            const emailProfissional = await prisma.profissional.findUnique({
                where: { email: email }
            });

            if(emailProfissional && emailProfissional.id !== id)
                throw new Error('E-mail ja cadastrado');
        }

        let senhaHash;
        if (senha){
            senhaHash = await bcrypt.hash(senha, 8);
        }

        const result = await prisma.profissional.update({
            where: { id },
            data: {
                nome: nome,
                email: email,
                senha: (senha && senhaHash) ? senhaHash : undefined,
                perfil: perfil as Perfil
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true
            }
        });

        return { result, message: 'Registro alterado'}
    }

    async delete(id: number, barbeariaId: number) {
        const profissional = await prisma.profissional.findFirst({
            where: { id, barbeariaId }
        });

        if (!profissional)
            throw new Error('Usuário não encontrado ou acesso negado')

        await prisma.profissional.delete({
            where: { id }
        });

        return { message: 'Registro excluído' };
    }
}