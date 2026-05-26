import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class PortalAuthController {
  async checkPhone(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }

    try {
      const empresa = await prisma.empresa.findUnique({
        where: { slug }
      });

      if (!empresa) {
        return res.status(404).json({ error: 'Barbearia não encontrada.' });
      }

      const cliente = await prisma.cliente.findFirst({
        where: {
          telefone,
          empresaId: empresa.id
        }
      });

      if (!cliente) {
        return res.json({ status: 'NOT_FOUND', empresaId: empresa.id });
      }

      if (cliente && !cliente.senha) {
        return res.json({ 
          status: 'EXISTS_WITHOUT_PASSWORD', 
          nome: cliente.nome,
          empresaId: empresa.id
        });
      }

      return res.json({ status: 'EXISTS_WITH_PASSWORD', empresaId: empresa.id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async login(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone, senha } = req.body;

    try {
      const empresa = await prisma.empresa.findUnique({ where: { slug } });
      if (!empresa) return res.status(404).json({ error: 'Barbearia não encontrada.' });

      const cliente = await prisma.cliente.findFirst({
        where: { telefone, empresaId: empresa.id }
      });

      if (!cliente || !cliente.senha) {
        return res.status(401).json({ error: 'Credenciais inválidas ou senha não definida.' });
      }

      const validPassword = await bcrypt.compare(senha, cliente.senha);
      if (!validPassword) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }

      const token = jwt.sign(
        { id: cliente.id, empresaId: empresa.id, isPortal: true },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async register(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone, senha, nome, email } = req.body;

    try {
      const empresa = await prisma.empresa.findUnique({ where: { slug } });
      if (!empresa) return res.status(404).json({ error: 'Barbearia não encontrada.' });

      const hashedSenha = await bcrypt.hash(senha, 10);

      let cliente = await prisma.cliente.findFirst({
        where: { telefone, empresaId: empresa.id }
      });

      if (cliente) {
        // Cenário B: Cliente existe mas sem senha
        if (cliente.senha) {
          return res.status(400).json({ error: 'Cliente já possui cadastro completo. Faça login.' });
        }
        cliente = await prisma.cliente.update({
          where: { id: cliente.id },
          data: { senha: hashedSenha }
        });
      } else {
        // Cenário A: Cliente totalmente novo
        if (!nome) {
          return res.status(400).json({ error: 'Nome é obrigatório para novos clientes.' });
        }
        cliente = await prisma.cliente.create({
          data: {
            nome,
            telefone,
            senha: hashedSenha,
            empresaId: empresa.id
          }
        });
      }

      const token = jwt.sign(
        { id: cliente.id, empresaId: empresa.id, isPortal: true },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}
