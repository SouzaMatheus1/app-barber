import { Request, Response } from 'express';
import { RelatorioService } from '../services/RelatorioService';

export class RelatorioController {
    private relatorioService = new RelatorioService();

    vendasProdutos = async (req: Request, res: Response) => {
        try {
            const { dataInicial, dataFinal } = req.query;

            if (!dataInicial || !dataFinal) {
                return res.status(400).json({ error: "dataInicial e dataFinal são obrigatórios." });
            }

            const startDate = new Date(dataInicial as string);
            const endDate = new Date(dataFinal as string);

            // Ajusta para o final do dia
            endDate.setHours(23, 59, 59, 999);

            const result = await this.relatorioService.getVendasProdutos(startDate, endDate);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
