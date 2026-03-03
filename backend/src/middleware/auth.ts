import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface Payload {
    id: number;
    perfil: string;
}

export function isAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res.status(401).json({ error: 'Token não fornecido' });

    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }
    try {
        const payload = verify(token, process.env.JWT_SECRET as string) as Payload;
        res.locals.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as Payload;

    if (!user || user.perfil !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }

    return next();
}