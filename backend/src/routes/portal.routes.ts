import { Router, Request, Response } from 'express';
import { ClienteAuthController } from '../controllers/ClienteAuthController';
import { AgendamentoController } from '../controllers/AgendamentoController';
import { AssinaturaController } from '../controllers/AssinaturaController';
import { isAuth } from '../middleware/auth';
import { prisma } from '../database/prisma';

const portalRoutes = Router();
const clienteAuthController = new ClienteAuthController();
const agendamentoController = new AgendamentoController();
const assinaturaController = new AssinaturaController();

// ------------------------------------------------------------------------------------------
// ROTAS PÚBLICAS (Aplicativo PWA do Cliente Final)
// ------------------------------------------------------------------------------------------

// 1. Autenticação e Registro Sem Senha
portalRoutes.post('/portal/auth/check-phone', clienteAuthController.checkPhone);
portalRoutes.post('/portal/auth/register', clienteAuthController.register);
portalRoutes.post('/portal/auth/login', clienteAuthController.login);

// 2. Histórico de Agendamentos do próprio cliente (Requer token de Cliente)
portalRoutes.get('/portal/meus-agendamentos', isAuth, async (req: Request, res: Response) => {
    try {
        const clienteId = res.locals.user.id;
        
        // Puxa todos os agendamentos feitos para esse cliente. 
        // Os cancelados, feitos e à fazer.
        const agendamentos = await prisma.agendamento.findMany({
            where: { clienteId },
            include: {
                profissional: { select: { id: true, nome: true } },
                servicos: { include: { item: true } }
            },
            orderBy: { dataHoraInicio: 'desc' }
        });

        // Separar lógicamente na resposta para facilitar o frontend
        const now = new Date();
        const response = {
            futuros: agendamentos.filter(a => new Date(a.dataHoraInicio) > now && a.status !== 'CANCELADO'),
            passados: agendamentos.filter(a => new Date(a.dataHoraInicio) <= now && a.status === 'CONCLUIDO'),
            cancelados: agendamentos.filter(a => a.status === 'CANCELADO')
        };

        return res.status(200).json(response);
    } catch (error: any) {
        return res.status(500).json({ error: 'Erro ao buscar o histórico.' });
    }
});

// 3. Status de Assinatura Ativa (Portal)
portalRoutes.get('/portal/minha-assinatura', isAuth, async (req: Request, res: Response) => {
    // Redireciona a chamada falsificando req.params
    req.params.clienteId = String(res.locals.user.id);
    return assinaturaController.getAssinaturaCliente(req, res);
});

// 4. Auto Agendamento pelo Cliente
// O AgendamentoController cria vai capturar o req.body. Aqui só usamos o mesmo controller para simplificar. 
// Para ser mais seguro no futuro, poderíamos criar uma rota específica do cliente.
portalRoutes.post('/portal/agendamentos', isAuth, async (req: Request, res: Response) => {
    // Força o ID do cliente autenticado pra garantir que ele não agende pros outros
    req.body.clienteId = res.locals.user.id;
    // O Cliente obedece a regra de 30minutos, então NÃO enviamos `ignorarAntecedencia: true` !
    return agendamentoController.criar(req, res);
});

export { portalRoutes };
