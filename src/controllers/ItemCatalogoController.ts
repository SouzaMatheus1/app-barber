import { Request, Response } from 'express';
import { ItemCatalogoService } from '../services/ItemCatalogoService';

export class ItemCatalogoController {
    async listar(req: Request, res: Response){
        const itemCatalogoService = new ItemCatalogoService();

        const result = await itemCatalogoService.listAll();
        
        return res.status(200).json(result);
    }

    async criar(req: Request, res: Response){
        const { nome, preco, comissao, tipoItemId } = req.body;
        const itemCatalogoService = new ItemCatalogoService();

        const result = await itemCatalogoService.create({
            nome,
            preco,
            comissao,
            tipoItemId
        });

        return res.status(201).json(result);
    }

    async editar(req: Request, res: Response){
        const id = Number(req.params.id);
        const { nome, preco, comissao, tipoItemId } = req.body;
        const itemCatalogoService = new ItemCatalogoService();

        const result = await itemCatalogoService.edit(
            id,
            {
                nome,
                preco,
                comissao,
                tipoItemId
            }
        );

        return res.status(200).json(result);
    }

    async deletar(req: Request, res: Response){
        const id = Number(req.params.id); 
        const itemCatalogoService = new ItemCatalogoService();

        const result = await itemCatalogoService.delete(id);

        return res.status(200).json(result);
    }
}