import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { StatusAgendamento } from '@prisma/client';
import { prisma } from '../database/prisma';

export class AgendamentoController {
    private agendamentoService = new AgendamentoService();

    listar = async (req: Request, res: Response) => {
        try {
            const { profissionalId, dataInicio, dataFim } = req.query;

            const loggedUser = res.locals.user;
            const isPortal = !!loggedUser?.isPortal;
            const clienteId = isPortal ? Number(loggedUser.id) : undefined;

            const agendamentos = await this.agendamentoService.listar(
                profissionalId ? Number(profissionalId) : undefined,
                dataInicio ? new Date(dataInicio as string) : undefined,
                dataFim ? new Date(dataFim as string) : undefined,
                clienteId
            );

            return res.status(200).json(agendamentos);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        try {
            const { dataHoraInicio, dataHoraFim, clienteId, profissionalId, servicosIds, observacao, status, usarCreditos } = req.body;

            if (!dataHoraInicio || !dataHoraFim || !profissionalId || !Array.isArray(servicosIds)) {
                return res.status(400).json({ error: 'Faltam parâmetros obrigatórios para o agendamento.' });
            }

            const loggedUser = res.locals.user;
            const isPortal = !!loggedUser?.isPortal;

            const finalClienteId = isPortal ? Number(loggedUser.id) : (clienteId ? Number(clienteId) : undefined);
            const finalStatus = isPortal ? 'CONFIRMADO' : (status as StatusAgendamento);
            const finalIgnorarAntecedencia = !isPortal; // Se for portal, NÃO ignora antecedência (valida 30min)

            const novoAgendamento = await this.agendamentoService.criar({
                dataHoraInicio,
                dataHoraFim,
                clienteId: finalClienteId,
                profissionalId: Number(profissionalId),
                servicosIds: servicosIds.map((id: any) => Number(id)),
                observacao: isPortal ? (observacao || 'Agendado via Portal') : observacao,
                status: finalStatus,
                ignorarAntecedencia: finalIgnorarAntecedencia,
                usarCreditos: !!usarCreditos
            });

            return res.status(201).json(novoAgendamento);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    alterarStatus = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            const { status } = req.body;

            if (!status || !Object.values(StatusAgendamento).includes(status)) {
                return res.status(400).json({ error: 'Status inválido fornecido.' });
            }

            const user = res.locals.user;
            if (user?.isPortal) {
                // Verificar se o agendamento pertence ao cliente do portal
                const agendamento = await prisma.agendamento.findUnique({
                    where: { id }
                });
                if (!agendamento || agendamento.clienteId !== user.id) {
                    return res.status(403).json({ error: 'Acesso negado. Este agendamento pertence a outro cliente.' });
                }
            }

            const alterado = await this.agendamentoService.alterarStatus(id, status as StatusAgendamento);
            return res.status(200).json(alterado);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            
            const user = res.locals.user;
            if (user?.isPortal) {
                return res.status(403).json({ error: 'Clientes do portal não podem excluir agendamentos fisicamente.' });
            }

            await this.agendamentoService.deletar(id);
            return res.status(200).json({ message: 'Agendamento removido fisicamente com sucesso.' });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    getDisponibilidade = async (req: Request, res: Response) => {
        try {
            const { profissionalId, data, duracaoMinutos } = req.query;

            if (!profissionalId || !data || !duracaoMinutos) {
                return res.status(400).json({ error: 'Parâmetros profissionalId, data e duracaoMinutos são obrigatórios.' });
            }

            const slots = await this.agendamentoService.getDisponibilidade(
                Number(profissionalId),
                data as string,
                Number(duracaoMinutos)
            );

            return res.status(200).json(slots);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
