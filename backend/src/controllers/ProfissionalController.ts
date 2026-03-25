import { Request, Response } from 'express';
import { ProfissionalService } from '../services/ProfissionalService';

export class ProfissionalController {
    private profissionalService = new ProfissionalService();
    
    listar = async (req: Request, res: Response) => {
        try {
            const result = await this.profissionalService.listAll();

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar profissionais' });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { nome, email, senha, perfilId } = req.body;

        try{
            const result = await this.profissionalService.create({
                nome,
                email,
                senha,
                perfilId
            });
    
            return res.status(201).json(result);

        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao cadastrar profissional' });
        }
    }

    editar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const { nome, email, senha, perfilId } = req.body;

        try{
            const result = await this.profissionalService.edit(
                id,
                {
                    nome,
                    email,
                    senha,
                    perfilId
                }
            );
    
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao editar registro' });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        try {
            const result = await this.profissionalService.delete(id);
    
            return res.status(400).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}