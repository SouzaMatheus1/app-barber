import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

export class ClienteController {
    private clienteService = new ClienteService();

    async listar(req: Request, res: Response){
        try{ 
            const result = await this.clienteService.listAll();
            
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async criar(req: Request, res: Response){
        const { nome, telefone } = req.body;

        try {
            const result = await this.clienteService.create({
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

        try {
            const result = await this.clienteService.edit(
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

        try {
            const result = await this.clienteService.delete(id);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}