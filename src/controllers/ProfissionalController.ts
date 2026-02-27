import { Request, Response } from 'express';
import { ProfissionalService } from '../services/ProfissionalService';

export class ProfissionalController {
    async listar(req: Request, res: Response){
        const profissionalService = new ProfissionalService();

        const result = await profissionalService.listAll();
        
        return res.status(200).json(result);
    }

    async criar(req: Request, res: Response){
        const { nome, email, senha, perfilId } = req.body;
        const profissionalService = new ProfissionalService();

        const result = await profissionalService.create({
            nome,
            email,
            senha,
            perfilId
        });

        return res.status(201).json(result);
    }

    async editar(req: Request, res: Response){
        const id = Number(req.params.id);
        const { nome, email, senha, perfilId } = req.body;
        const profissionalService = new ProfissionalService();

        const result = await profissionalService.edit(
            id,
            {
                nome,
                email,
                senha,
                perfilId
            }
        );

        return res.status(201).json(result);
    }

    async deletar(req: Request, res: Response){
        const id = Number(req.params.id); 
        const profissionalService = new ProfissionalService();

        const result = await profissionalService.delete(id);

        return res.status(400).json(result);
    }
}