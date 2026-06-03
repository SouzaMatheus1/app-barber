import { Request, Response } from 'express';
import { prisma } from '../database/prisma';
import { tenantStorage } from '../database/tenantContext';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class PortalAuthController {
  async checkPhone(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone } = req.body;

    if (!telefone || typeof telefone !== 'string') {
      return res.status(400).json({ error: 'Telefone é obrigatório e deve ser uma string.' });
    }

    try {
      const empresa = await prisma.empresa.findUnique({
        where: { slug }
      });

      if (!empresa) {
        return res.status(404).json({ error: 'Barbearia não encontrada.' });
      }

      // Envolvemos a execução no contexto do tenant da empresa correspondente
      return await tenantStorage.run({ empresaId: empresa.id }, async () => {
        const cliente = await prisma.cliente.findFirst({
          where: {
            telefone
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
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async login(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone, senha } = req.body;

    if (!telefone || typeof telefone !== 'string') {
      return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }
    if (!senha || typeof senha !== 'string') {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    try {
      const empresa = await prisma.empresa.findUnique({ where: { slug } });
      if (!empresa) return res.status(404).json({ error: 'Barbearia não encontrada.' });

      return await tenantStorage.run({ empresaId: empresa.id }, async () => {
        const cliente = await prisma.cliente.findFirst({
          where: { telefone }
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
          process.env.JWT_SECRET as string, // <-- CORREÇÃO: Sem fallback inseguro
          { expiresIn: '7d' }
        );
        
        return res.json({
          token,
          cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async register(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const { telefone, senha, nome } = req.body;

    if (!telefone || typeof telefone !== 'string') {
      return res.status(400).json({ error: 'Telefone é obrigatório.' });
    }
    if (!senha || typeof senha !== 'string') {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }
    if (nome !== undefined && typeof nome !== 'string') {
      return res.status(400).json({ error: 'Nome deve ser uma string.' });
    }

    try {
      const empresa = await prisma.empresa.findUnique({ where: { slug } });
      if (!empresa) return res.status(404).json({ error: 'Barbearia não encontrada.' });

      const hashedSenha = await bcrypt.hash(senha, 10);

      return await tenantStorage.run({ empresaId: empresa.id }, async () => {
        let cliente = await prisma.cliente.findFirst({
          where: { telefone }
        });

        if (cliente) {
          if (cliente.senha) {
            return res.status(400).json({ error: 'Cliente já possui cadastro completo. Faça login.' });
          }
          cliente = await prisma.cliente.update({
            where: { id: cliente.id },
            data: { senha: hashedSenha }
          });
        } else {
          if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório para novos clientes.' });
          }
          cliente = await prisma.cliente.create({
            data: {
              nome,
              telefone,
              senha: hashedSenha
            }
          });
        }

        const token = jwt.sign(
          { id: cliente.id, empresaId: empresa.id, isPortal: true },
          process.env.JWT_SECRET as string, // <-- CORREÇÃO: Sem fallback inseguro
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  async getEmpresa(req: Request, res: Response) {
    const slug = req.params.slug as string;

    try {
      const empresa = await prisma.empresa.findUnique({
        where: { slug },
        select: {
          id: true,
          nomeFantasia: true,
          slug: true
        }
      });

      if (!empresa) {
        return res.status(404).json({ error: 'Barbearia não encontrada.' });
      }

      return res.json(empresa);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }
}
