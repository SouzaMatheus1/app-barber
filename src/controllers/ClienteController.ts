import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

export class ClienteController {
    async listar(req: Request, res: Response){
        const clienteService = new ClienteService();

        try{ 
            const result = await clienteService.listAll();
            
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async criar(req: Request, res: Response){
        const { nome, telefone } = req.body;
        const clienteService = new ClienteService();

        try {
            const result = await clienteService.create({
                nome,
                telefone
            });
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async editar(req: Request, res: Response){
        const id = Number(req.params.id);
        const { nome, telefone } = req.body;
        const clienteService = new ClienteService();

        try {
            const result = await clienteService.edit(
                id,
                {
                    nome,
                    telefone
                }
            );
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async deletar(req: Request, res: Response){
        const id = Number(req.params.id); 
        const clienteService = new ClienteService();

        try {
            const result = await clienteService.delete(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}