import { Request, Response } from 'express';
import { AssinaturaService } from '../services/AssinaturaService';

const assinaturaService = new AssinaturaService();

export class AssinaturaController {
    
    async criarPlano(req: Request, res: Response) {
        try {
            const plano = await assinaturaService.createPlano(req.body);
            res.status(201).json(plano);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listarPlanos(req: Request, res: Response) {
        try {
            const planos = await assinaturaService.getPlanos();
            res.status(200).json(planos);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async editarPlano(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const plano = await assinaturaService.editPlano(id, req.body);
            res.status(200).json(plano);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async deletarPlano(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            await assinaturaService.deletePlano(id);
            res.status(200).json({ message: 'Plano desativado com sucesso' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async assinar(req: Request, res: Response) {
        try {
            const { clienteId, planoId, profissionalIdParaTransacao } = req.body;
            if (!clienteId || !planoId || !profissionalIdParaTransacao) {
                res.status(400).json({ error: "Faltam parâmetros obrigatórios." });
                return;
            }
            const assinatura = await assinaturaService.subscribe(Number(clienteId), Number(planoId), Number(profissionalIdParaTransacao));
            res.status(201).json(assinatura);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getAssinaturaCliente(req: Request, res: Response) {
        try {
            const clienteId = Number(req.params.clienteId);
            const ativa = await assinaturaService.getAssinaturaAtivaByClienteId(clienteId);
            res.status(200).json(ativa);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async listarAssinaturas(req: Request, res: Response) {
        try {
            const assinaturas = await assinaturaService.getAssinaturas();
            res.status(200).json(assinaturas);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
