import { Request, Response } from 'express';
import { prisma } from '../database/prisma';

export const TemaController = {
  // Rota pública: Buscar tema pelo slug da empresa
  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;

      const empresa = await prisma.empresa.findUnique({
        where: { slug }
      });

      if (!empresa) {
        res.status(404).json({ error: 'Empresa não encontrada' });
        return;
      }

      // Funcionalidade de temas pausada: Retornar payload padrão
      const tema = {
        corPrimaria: '#C9A84C',
        corSecundaria: '#E2C175',
        corFundo: '#0A0A0A',
        corSuperficie: '#111111',
        corTexto: '#F5F5F5',
        logoUrl: null,
        faviconUrl: null
      };

      res.status(200).json(tema);
    } catch (error) {
      console.error('Erro ao buscar tema:', error);
      res.status(500).json({ error: 'Erro interno ao buscar o tema.' });
    }
  },

  // Rota privada: Atualizar ou criar o tema da própria empresa logada
  async update(req: Request, res: Response): Promise<void> {
    try {
      res.status(501).json({ error: 'Funcionalidade de temas temporariamente desativada.' });
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar o tema.' });
    }
  }
};
