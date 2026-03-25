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
        const { tipoTransacaoId, descricao, profissionalId, clienteId, itens } = req.body;

        try {
            const result = await this.transacaoService.create({
                tipoTransacaoId,
                descricao,
                profissionalId,
                clienteId,
                itens
            });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // async editar(req: Request, res: Response) {
    //     const id = Number(req.params.id);
    //     const { tipoTransacaoId, descricao, valorTotal, profissionalId, clienteId, itens } = req.body;

    //     try {
    //         const result = await this.transacaoService.edit(
    //             id,
    //             {
                    
    //             }
    //         )
    //     } catch (error: any) {
    //         return res.status(400).json({ error: error.message });
    //     }
    // }

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