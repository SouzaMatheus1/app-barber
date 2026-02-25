import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';

export class ProfissionalService {
    // async create(data: any) {
    //     const { nome, email, senha, perfil } = data;

    //     const profissionalCadastrado = await prisma.profissional.findUnique({
    //         where: { email }
    //     });

    //     if (profissionalCadastrado)
    //         throw new Error('email ja cadastrado');

    //     // hash da senha
    //     const senhaHash = await bcrypt.hash(senha, 8);

    //     const profissional = await prisma.profissional.create({
    //         data: {
    //             nome,
    //             email,
    //             senha: senhaHash,
    //             perfil
    //         },
    //         select: {
    //             id: true,
    //             nome: true,
    //             email: true,
    //             perfil: true,
    //             criadoEm: true
    //         }
    //     });

    //     return profissional;
    // }

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

    // async delete(id: string) {
    //     const profissional = prisma.profissional.findUnique({
    //         where: { id }
    //     });

    //     if (!profissional)
    //         throw new Error('usuário nao encontrado')

    //     await prisma.profissional.delete({
    //         where: { id }
    //     });

    //     return { message: 'registro excluido' };
    // }
}