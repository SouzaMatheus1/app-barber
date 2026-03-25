import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
    private authService = new AuthService();
    login = async (req: Request, res: Response) => {
        const { email, senha } = req.body;

        try {
            const result = await this.authService.login(email, senha);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(401).json({ error: error.message });
        }
    }
}