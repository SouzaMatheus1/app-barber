import { Request, Response } from 'express';
import { CaixaService } from '../services/CaixaService';

export class CaixaController {
    private caixaService = new CaixaService();
    
    async resumo(req: Request, res: Response) {
        const data = req.query.data as string;

        try {
            const result = await this.caixaService.resumoDiario(data);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}