import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface Payload {
    id: number;
    perfil: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'BARBEIRO';
    barbeariaId: number;
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
    } catch (err: any) {
        console.error("Erro JWT Verify:", err);
        return res.status(401).json({ error: 'Token inválido', detalhes: err?.message || 'Erro desconhecido' });
    }
}

export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as Payload;

    if (!user || user.perfil !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas Super Administradores podem acessar esta rota.' });
    }

    return next();
}

export function isTenantAdmin(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as Payload;

    if (!user || (user.perfil !== 'TENANT_ADMIN' && user.perfil !== 'SUPER_ADMIN')) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores da barbearia podem acessar esta rota.' });
    }

    return next();
}