import { Request, Response } from 'express';
import { AtivoService } from '../services/AtivoService';

export class AtivoController {
  private ativoService = new AtivoService();

  listarPorCliente = async (req: Request, res: Response) => {
    try {
      const clienteId = Number(req.params.clienteId);
      if (isNaN(clienteId)) {
        return res.status(400).json({ error: 'ID do cliente inválido.' });
      }

      const result = await this.ativoService.listarPorCliente(clienteId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  criar = async (req: Request, res: Response) => {
    try {
      const { clienteId, tipoAtivoId, nome, detalhesVeiculo, detalhesAnimal } = req.body;

      if (!clienteId || !tipoAtivoId || !nome) {
        return res.status(400).json({ error: 'Os campos clienteId, tipoAtivoId e nome são obrigatórios.' });
      }

      const result = await this.ativoService.criar({
        clienteId: Number(clienteId),
        tipoAtivoId: Number(tipoAtivoId),
        nome,
        detalhesVeiculo,
        detalhesAnimal
      });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  atualizar = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID do ativo inválido.' });
      }

      const { nome, detalhesVeiculo, detalhesAnimal } = req.body;

      const result = await this.ativoService.atualizar(id, {
        nome,
        detalhesVeiculo,
        detalhesAnimal
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  desativar = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID do ativo inválido.' });
      }

      const result = await this.ativoService.desativar(id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  listarTiposPermitidos = async (req: Request, res: Response) => {
    try {
      const result = await this.ativoService.listarTiposPermitidos();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
