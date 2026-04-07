import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

export class ClienteController {
    private clienteService = new ClienteService();

    listar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        try{ 
            const result = await this.clienteService.listAll(barbeariaId);
            
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    search = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        try {
            const q = req.query.q as string;
            if (!q) return res.status(200).json([]);
            
            const result = await this.clienteService.searchByName(q, barbeariaId);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const { nome, telefone, planoId } = req.body;

        try {
            const result = await this.clienteService.create({
                nome,
                telefone,
                planoId: planoId ? Number(planoId) : undefined
            }, barbeariaId);
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    editar = async (req: Request, res: Response) => {
        const { barbeariaId } = res.locals.user;
        const id = Number(req.params.id);
        const { nome, telefone, planoId } = req.body;

        try {
            const result = await this.clienteService.edit(
                id,
                {
                    nome,
                    telefone,
                    planoId: planoId ? Number(planoId) : undefined
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
            const result = await this.clienteService.delete(id, barbeariaId);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}