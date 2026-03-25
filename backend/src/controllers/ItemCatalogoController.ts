import { Request, Response } from 'express';
import { ItemCatalogoService } from '../services/ItemCatalogoService';

export class ItemCatalogoController {
    private itemCatalogoService = new ItemCatalogoService();
    listar = async (req: Request, res: Response) => {
        try {
            const result = await this.itemCatalogoService.listAll();

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { nome, preco, comissao, tipoItemId } = req.body;

        try {
            const result = await this.itemCatalogoService.create({
                nome,
                preco,
                comissao,
                tipoItemId
            });

            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const { nome, preco, comissao, tipoItemId } = req.body;

        try {
            const result = await this.itemCatalogoService.edit(
                id,
                {
                    nome,
                    preco,
                    comissao,
                    tipoItemId
                }
            );

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        try {
            const result = await this.itemCatalogoService.delete(id);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}