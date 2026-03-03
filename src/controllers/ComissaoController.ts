import { Request, Response } from 'express';
import { ComissaoService } from '../services/ComissaoService';

export class ComissaoController {
    async relatorio(req: Request, res: Response) {
        const profissionalId = Number(req.params.id);
        
        // Pega as datas da URL, garantindo que sejam strings
        const dataInicio = req.query.dataInicio as string;
        const dataFim = req.query.dataFim as string;

        const comissaoService = new ComissaoService();

        try {
            const result = await comissaoService.calcularComissao(profissionalId, dataInicio, dataFim);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}