import { Request, Response } from 'express';
import { TemaService } from '../services/TemaService';

export const TemaController = {
  // Rota pública: Buscar tema pelo slug da empresa
  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;

      const tema = await TemaService.getBySlug(slug);

      if (!tema) {
        res.status(404).json({ error: 'Empresa não encontrada' });
        return;
      }

      res.status(200).json(tema);
    } catch (error) {
      console.error('Erro ao buscar tema:', error);
      res.status(500).json({ error: 'Erro interno ao buscar o tema.' });
    }
  },

  // Rota privada: Atualizar ou criar o tema da própria empresa logada
  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = res.locals.user;
      if (!user || !user.empresaId) {
        res.status(401).json({ error: 'Não autorizado.' });
        return;
      }

      const updatedTema = await TemaService.updateTemaEmpresa(user.empresaId, req.body);
      res.status(200).json(updatedTema);
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      res.status(500).json({ error: 'Erro interno ao atualizar o tema.' });
    }
  }
};
