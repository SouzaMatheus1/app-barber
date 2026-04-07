import { Request, Response } from 'express';
import { TenancyService } from '../services/TenancyService';

export class TenancyController {
    private tenancyService = new TenancyService();

    criar = async (req: Request, res: Response) => {
        const { nomeBarbearia, cnpj, descricao, nomeAdmin, emailAdmin, senhaAdmin } = req.body;

        try {
            const result = await this.tenancyService.createTenant({
                nomeBarbearia,
                cnpj,
                descricao,
                nomeAdmin,
                emailAdmin,
                senhaAdmin
            });

            return res.status(201).json({
                message: 'Barbearia e administrador criados com sucesso',
                result
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    listar = async (req: Request, res: Response) => {
        try {
            const tenants = await this.tenancyService.listTenants();
            return res.status(200).json(tenants);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
