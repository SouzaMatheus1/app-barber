import { Request, Response } from 'express';
import { CustoRecorrenteService } from '../services/CustoRecorrenteService';

export class CustoRecorrenteController {
    private service = new CustoRecorrenteService();

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
            const { descricao, valor, diaVencimento, categoriaCustoId } = req.body;
            const result = await this.service.criar({
                descricao,
                valor: Number(valor),
                diaVencimento: Number(diaVencimento),
                categoriaCustoId: categoriaCustoId ? Number(categoriaCustoId) : undefined
            });
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const { descricao, valor, diaVencimento, categoriaCustoId } = req.body;
            const result = await this.service.editar(id, {
                descricao,
                valor: valor !== undefined ? Number(valor) : undefined,
                diaVencimento: diaVencimento !== undefined ? Number(diaVencimento) : undefined,
                categoriaCustoId: categoriaCustoId !== undefined ? Number(categoriaCustoId) : undefined
            });
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const result = await this.service.deletar(id);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    lancar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const result = await this.service.lancarPagamento(id);
            return res.json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
