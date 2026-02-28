import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';

export class ProfissionalService {
    async listAll() {
        const profissionais = await prisma.profissional.findMany({
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

    async create(data: {
        nome: string,
        email: string,
        senha:string, 
        perfilId: number
    }) {
        const { nome, email, senha, perfilId } = data;

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
                perfil: {connect: { id: perfilId }}
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

    async edit(id: number, data: any) {
        const { nome, email, senha, perfilId } = data;

        const profissional = await prisma.profissional.findUnique({
            where: { id }
        });

        if(!profissional)
            throw new Error('Usuário não encontrado');

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
                senha: senhaHash,
                perfil: { connect: { id: perfilId }}
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

    async delete(id: number) {
        const profissional = await prisma.profissional.findUnique({
            where: { id }
        });

        if (!profissional)
            throw new Error('Usuário não encontrado')

        await prisma.profissional.delete({
            where: { id }
        });

        return { message: 'Registro excluído' };
    }
}