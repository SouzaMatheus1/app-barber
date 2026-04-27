import { Request, Response } from 'express';
import { TransacaoService } from '../services/TransacaoService';

export class TransacaoController {
    private transacaoService = new TransacaoService();
    
    listar = async (req: Request, res: Response) => {
        const result = await this.transacaoService.listAll();
        return res.status(200).json(result);
    }

    criar = async (req: Request, res: Response) => {
        const { tipoTransacaoId, descricao, profissionalId, clienteId, itens, formaPagamentoId, data, valorTotal, categoriaCustoId } = req.body;

        const result = await this.transacaoService.create({
            tipoTransacaoId,
            descricao,
            profissionalId,
            clienteId,
            formaPagamentoId,
            data,
            itens,
            valorTotal,
            categoriaCustoId
        });

        return res.status(201).json(result);
    }

    editar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const { descricao, valorTotal, formaPagamentoId, data } = req.body;

        const result = await this.transacaoService.edit(id, {
            descricao,
            valorTotal,
            formaPagamentoId,
            data
        });
        return res.status(200).json(result);
    }

    deletar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        const result = await this.transacaoService.delete(id);

        return res.status(200).json(result);
    }
}