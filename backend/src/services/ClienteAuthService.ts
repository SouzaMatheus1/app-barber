import { prisma } from '../database/prisma';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

export class ClienteAuthService {
    async checkPhone(telefone: string) {
        const cliente = await prisma.cliente.findFirst({
            where: { telefone }
        });

        if (!cliente) {
            return { status: 'NOT_FOUND' };
        }

        if (!cliente.senha) {
            return { status: 'EXISTS_WITHOUT_PASSWORD', nome: cliente.nome, id: cliente.id };
        }

        return { status: 'EXISTS_WITH_PASSWORD' };
    }

    async registerOrSetup(data: { telefone: string; senha?: string; nome?: string; email?: string }) {
        if (!data.senha) {
            throw new Error('A senha é obrigatória para o cadastro no portal.');
        }

        const hashedSenha = await bcrypt.hash(data.senha, 10);
        let cliente = await prisma.cliente.findFirst({ where: { telefone: data.telefone } });

        if (cliente) {
            if (cliente.senha) {
                throw new Error('Este telefone já possui uma conta. Faça o login.');
            }
            // Update existant
            cliente = await prisma.cliente.update({
                where: { id: cliente.id },
                data: {
                    senha: hashedSenha,
                    email: data.email || cliente.email,
                    nome: data.nome || cliente.nome
                }
            });
        } else {
            if (!data.nome) {
                throw new Error('O nome é obrigatório para novos cadastros.');
            }
            // Create new
            cliente = await prisma.cliente.create({
                data: {
                    telefone: data.telefone,
                    nome: data.nome,
                    senha: hashedSenha,
                    email: data.email
                }
            });
        }

        const token = sign(
            { id: cliente.id, perfil: 'CLIENTE' },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        return {
            token,
            cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
        };
    }

    async login(telefone: string, senhaDigitada: string) {
        const cliente = await prisma.cliente.findFirst({ where: { telefone } });

        if (!cliente || !cliente.senha) {
            throw new Error('Telefone ou senha inválidos.');
        }

        const senhaBate = await bcrypt.compare(senhaDigitada, cliente.senha);
        if (!senhaBate) {
            throw new Error('Telefone ou senha inválidos.');
        }

        const token = sign(
            { id: cliente.id, role: 'CLIENTE' },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        return {
            token,
            cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
        };
    }
}
