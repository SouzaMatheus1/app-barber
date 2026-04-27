import { Request, Response } from 'express';
import { CategoriaCustoService } from '../services/CategoriaCustoService';

export class CategoriaCustoController {
    private service = new CategoriaCustoService();

    listar = async (req: Request, res: Response) => {
        try {
            const result = await this.service.listar();
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        try {
            const { descricao } = req.body;
            const result = await this.service.criar(descricao);
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const { descricao } = req.body;
            const result = await this.service.editar(id, descricao);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            await this.service.deletar(id);
            return res.json({ message: 'Categoria excluída com sucesso' });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
