import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';
import { Perfil } from '@prisma/client';

export class ProfissionalService {
    async listAll() {
        const profissionais = prisma.profissional.findMany({
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

    async create(data: any) {
        const { nome, email, senha, perfil } = data;

        const profissionalCadastrado = await prisma.profissional.findUnique({
            where: { email }
        });

        if (profissionalCadastrado)
            throw new Error('email ja cadastrado');

        // hash da senha
        const senhaHash = await bcrypt.hash(senha, 8);

        const profissional = await prisma.profissional.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                perfil
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

    async edit(id: number, data: { nome?: string, email?: string, senha?: string, perfil?: string }) {
        const profissional = await prisma.profissional.findUnique({
            where: { id }
        });

        if(!profissional)
            throw new Error('Usuario nao encontrado');

        if(data.email) {
            const emailProfissional = await prisma.profissional.findUnique({
                where: { email: data.email }
            });

            if(emailProfissional && emailProfissional.id == id)
                throw new Error('Email ja cadastrado');
        }

        let senhaHash;
        if (data.senha){
            senhaHash = await bcrypt.hash(data.senha, 8);
        }

        const result = await prisma.profissional.update({
            where: { id },
            data: {
                nome: data.nome,
                email: data.email,
                senha: senhaHash,
                perfil: data.perfil as Perfil
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true
            }
        });

        return { result, message: 'registro alterado'}
    }


    async delete(id: number) {
        const profissional = await prisma.profissional.findUnique({
            where: { id }
        });

        if (!profissional)
            throw new Error('usuário nao encontrado')

        await prisma.profissional.delete({
            where: { id }
        });

        return { message: 'registro excluido' };
    }
}