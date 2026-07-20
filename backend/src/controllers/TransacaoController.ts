import { Request, Response } from 'express';
import { TransacaoService } from '../services/TransacaoService';

export class TransacaoController {
    private transacaoService = new TransacaoService();
    
    listar = async (req: Request, res: Response) => {
        try {
            const result = await this.transacaoService.listAll();
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar transações' });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { tipoTransacaoId, descricao, profissionalId, clienteId, itens, formaPagamentoId, data, valorTotal, categoriaCustoId, ativoId } = req.body;

        try {
            const result = await this.transacaoService.create({
                tipoTransacaoId,
                descricao,
                profissionalId,
                clienteId,
                formaPagamentoId,
                data,
                itens,
                valorTotal,
                categoriaCustoId,
                ativoId: ativoId ? Number(ativoId) : undefined
            });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const { descricao, valorTotal, formaPagamentoId, data } = req.body;

        try {
            const result = await this.transacaoService.edit(id, {
                descricao,
                valorTotal,
                formaPagamentoId,
                data
            });
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        try {
            const result = await this.transacaoService.delete(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}