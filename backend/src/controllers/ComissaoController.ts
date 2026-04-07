import { Request, Response } from 'express';
import { ComissaoService } from '../services/ComissaoService';

export class ComissaoController {
    private comissaoService = new ComissaoService();
    relatorio = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const profissionalId = Number(req.params.id);
        
        const dataInicio = req.query.dataInicio as string;
        const dataFim = req.query.dataFim as string;

        if (!dataInicio || !dataFim || !profissionalId) {
            return res.status(400).json({ error: "Os parâmetros dataInicio, dataFim e o profissionalId são obrigatórios." });
        }

        try {
            const result = await this.comissaoService.calcularComissao(barbeariaId, profissionalId, dataInicio, dataFim);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}