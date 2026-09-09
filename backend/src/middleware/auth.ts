import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { tenantStorage } from '../database/tenantContext';

interface Payload {
    id: number;
    perfil: string;
    empresaId: number;
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
        
        // Setup Tenant Context for the current request
        tenantStorage.run({ empresaId: payload.empresaId }, () => {
            next();
        });
    } catch (err: any) {
        console.error("Erro JWT Verify:", err);
        return res.status(401).json({ error: 'Token inválido', detalhes: err?.message || 'Erro desconhecido' });
    }
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as Payload;

    if (!user || user.perfil !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }

    return next();
}

// Distingue o admin da plataforma (você, dono do SaaS) do admin de um tenant (dono da barbearia X).
// `isAdmin` só identifica o segundo. Aqui comparamos o empresaId do token com o tenant da própria
// plataforma (PLATFORM_EMPRESA_ID), já que hoje não existe um papel de plataforma no modelo de dados.
// TODO: substituir por um mecanismo de papel de plataforma real caso surjam múltiplos operadores.
export function isPlatformAdmin(req: Request, res: Response, next: NextFunction) {
    const user = res.locals.user as Payload;
    const platformEmpresaId = Number(process.env.PLATFORM_EMPRESA_ID);

    if (!platformEmpresaId || !user || user.empresaId !== platformEmpresaId) {
        return res.status(403).json({ error: 'Acesso negado. Apenas a administração da plataforma pode acessar esta rota.' });
    }

    return next();
}