import { Request, Response } from 'express';
import { ProfissionalService } from '../services/ProfissionalService';

export class ProfissionalController {
    // async create(req: Request, res: Response){
    //     const { nome, email, senha, perfil } = req.body;
    //     const profissionalService = new ProfissionalService();

    //     const result = await profissionalService.create({
    //         nome,
    //         email,
    //         senha,
    //         perfil
    //     });

    //     return res.status(201).json(result);
    // }

    async listar(req: Request, res: Response){
        const profissionalService = new ProfissionalService();

        const result = await profissionalService.listAll();
        
        return res.status(200).json(result);
    }

    // async deletar(req: Request, res: Response){
    //     const { profissionalID } = req.params;
    //     const profissionalService = new ProfissionalService();

    //     const result = await profissionalService.delete(profissionalID)
    // }
}