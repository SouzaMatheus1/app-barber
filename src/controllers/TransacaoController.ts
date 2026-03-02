import { Request, Response } from 'express';
import { TransacaoService, TransacaoService } from '../services/TransacaoService';

export class TransacaoController {
    async listar(req: Request, res: Response) {
        const transacaoService = new TransacaoService();

        try {
            const result = await transacaoService.listAll();

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar transações' });
        }
    }

    async criar(req: Request, res: Response) {
        const { tipoTransacaoId, descricao, valorTotal, profissionalId, clienteId, itens } = req.body;
        const transacaoService = new TransacaoService();

        try {
            const result = await transacaoService.create({
                tipoTransacaoId,
                descricao,
                valorTotal,
                profissionalId,
                clienteId,
                itens
            });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async editar(req: Request, res: Response) {
        const id = Number(req.params.id);
        const { tipoTransacaoId, descricao, valorTotal, profissionalId, clienteId, itens } = req.body;
        const transacaoService = new TransacaoService();

        try {
            const result = await transacaoService.edit(
                id,
                {
                    
                }
            )
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async deletar(req: Request, res: Response) {
        const id = Number(req.params.id);
        const transacaoService = new TransacaoService();

        try {
            const result = await transacaoService.delete(id);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}