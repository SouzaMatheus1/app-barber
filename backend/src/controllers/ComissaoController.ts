import { Request, Response } from 'express';
import { ComissaoService } from '../services/ComissaoService';

export class ComissaoController {
    private comissaoService = new ComissaoService();
    relatorio = async (req: Request, res: Response) => {
        const profissionalId = Number(req.params.id);
        
        // Pega as datas da URL, garantindo que sejam strings
        const dataInicio = req.query.dataInicio as string;
        const dataFim = req.query.dataFim as string;


        try {
            const result = await this.comissaoService.calcularComissao(profissionalId, dataInicio, dataFim);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}