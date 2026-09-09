import { Request, Response } from 'express';
import { ChangelogService } from '../services/ChangelogService';

export class ChangelogController {
  private changelogService = new ChangelogService();

  criar = async (req: Request, res: Response) => {
    try {
      const { titulo, descricao, tipoEmpresaId } = req.body;

      const result = await this.changelogService.criar({
        titulo,
        descricao,
        tipoEmpresaId: tipoEmpresaId !== undefined ? Number(tipoEmpresaId) : undefined
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  listar = async (req: Request, res: Response) => {
    try {
      const result = await this.changelogService.listarParaTenant();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  contarNaoLidas = async (req: Request, res: Response) => {
    try {
      const result = await this.changelogService.contarNaoLidas();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  marcarVisualizado = async (req: Request, res: Response) => {
    try {
      const result = await this.changelogService.marcarComoVisualizado();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
