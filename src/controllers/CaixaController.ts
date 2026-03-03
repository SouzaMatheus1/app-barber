import { Request, Response } from 'express';
import { CaixaService } from '../services/CaixaService';

export class CaixaController {
    async resumo(req: Request, res: Response) {
        const data = req.query.data as string;
        const caixaService = new CaixaService();

        try {
            const result = await caixaService.resumoDiario(data);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}