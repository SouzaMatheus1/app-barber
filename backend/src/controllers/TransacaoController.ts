import { Request, Response } from 'express';
import { TransacaoService } from '../services/TransacaoService';
import { TipoTransacao } from '@prisma/client';

export class TransacaoController {
    private transacaoService = new TransacaoService();
    
    listar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        try {
            const result = await this.transacaoService.listAll(barbeariaId);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar transações' });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const { tipoTransacaoId, descricao, profissionalId, clienteId, itens } = req.body;

        // Mapeamento simples de ID para Enum para manter compatibilidade com o frontend atual
        const tipoMap: Record<number, TipoTransacao> = {
            1: TipoTransacao.ENTRADA,
            2: TipoTransacao.SAIDA
        };

        const tipo = tipoMap[Number(tipoTransacaoId)] || TipoTransacao.ENTRADA;

        try {
            const result = await this.transacaoService.create({
                tipo,
                descricao,
                profissionalId: Number(profissionalId),
                clienteId: clienteId ? Number(clienteId) : undefined,
                itens: itens.map((i: any) => ({
                    itemId: Number(i.itemId),
                    quantidade: Number(i.quantidade),
                    usouCreditoAssinatura: !!i.usouCreditoAssinatura
                }))
            }, barbeariaId);

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);

        try {
            const result = await this.transacaoService.delete(id, barbeariaId);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}