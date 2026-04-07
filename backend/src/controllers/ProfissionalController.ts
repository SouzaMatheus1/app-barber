import { Request, Response } from 'express';
import { ProfissionalService } from '../services/ProfissionalService';
import { Perfil } from '@prisma/client';

export class ProfissionalController {
    private profissionalService = new ProfissionalService();
    
    listar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        try {
            const result = await this.profissionalService.listAll(barbeariaId);

            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro ao buscar profissionais' });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const { nome, email, senha, perfilId } = req.body;

        const perfilMap: Record<number, Perfil> = {
            1: Perfil.TENANT_ADMIN,
            2: Perfil.BARBEIRO
        };

        const perfil = perfilMap[Number(perfilId)] || Perfil.BARBEIRO;

        try{
            const result = await this.profissionalService.create({
                nome,
                email,
                senha,
                perfil
            }, barbeariaId);
    
            return res.status(201).json(result);

        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Erro ao cadastrar profissional' });
        }
    }

    editar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);
        const { nome, email, senha, perfilId } = req.body;

        const perfilMap: Record<number, Perfil> = {
            1: Perfil.TENANT_ADMIN,
            2: Perfil.BARBEIRO
        };

        const perfil = perfilId ? perfilMap[Number(perfilId)] : undefined;

        try{
            const result = await this.profissionalService.edit(
                id,
                {
                    nome,
                    email,
                    senha,
                    perfil
                },
                barbeariaId
            );
    
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Erro ao editar registro' });
        }
    }

    deletar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);

        try {
            const result = await this.profissionalService.delete(id, barbeariaId);
    
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}