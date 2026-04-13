import { Request, Response } from 'express';
import { ClienteAuthService } from '../services/ClienteAuthService';

export class ClienteAuthController {
    private clienteAuthService = new ClienteAuthService();

    checkPhone = async (req: Request, res: Response) => {
        try {
            const { telefone } = req.body;
            if (!telefone) {
                return res.status(400).json({ error: 'Telefone é obrigatório.' });
            }

            const result = await this.clienteAuthService.checkPhone(telefone);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    register = async (req: Request, res: Response) => {
        try {
            const { telefone, senha, nome, email } = req.body;
            const result = await this.clienteAuthService.registerOrSetup({
                telefone,
                senha,
                nome,
                email
            });
            return res.status(201).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const { telefone, senha } = req.body;
            if (!telefone || !senha) {
                return res.status(400).json({ error: 'Telefone e senha são obrigatórios.' });
            }

            const result = await this.clienteAuthService.login(telefone, senha);
            console.log(result);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
