import { Request, Response } from 'express';
import { ItemCatalogoService } from '../services/ItemCatalogoService';
import { TipoItem } from '@prisma/client';

export class ItemCatalogoController {
    private itemCatalogoService = new ItemCatalogoService();
    
    listar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        try {
            const result = await this.itemCatalogoService.listAll(barbeariaId);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const { nome, preco, comissao, tipoItemId } = req.body;

        const tipoMap: Record<number, TipoItem> = {
            1: TipoItem.SERVICO,
            2: TipoItem.PRODUTO
        };

        const tipo = tipoMap[Number(tipoItemId)] || TipoItem.SERVICO;

        try {
            const result = await this.itemCatalogoService.create({
                nome,
                preco: Number(preco),
                comissao: comissao ? Number(comissao) : undefined,
                tipo
            }, barbeariaId);

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);
        const { nome, preco, comissao, tipoItemId } = req.body;

        const tipoMap: Record<number, TipoItem> = {
            1: TipoItem.SERVICO,
            2: TipoItem.PRODUTO
        };

        const tipo = tipoItemId ? tipoMap[Number(tipoItemId)] : undefined;

        try {
            const result = await this.itemCatalogoService.edit(
                id,
                {
                    nome,
                    preco: preco ? Number(preco) : undefined,
                    comissao: comissao ? Number(comissao) : undefined,
                    tipo
                },
                barbeariaId
            );

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);

        try {
            const result = await this.itemCatalogoService.delete(id, barbeariaId);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}