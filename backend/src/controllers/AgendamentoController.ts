import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { StatusAgendamento } from '@prisma/client';

export class AgendamentoController {
    private agendamentoService = new AgendamentoService();

    listar = async (req: Request, res: Response) => {
        try {
            const { profissionalId, dataInicio, dataFim } = req.query;

            const agendamentos = await this.agendamentoService.listar(
                profissionalId ? Number(profissionalId) : undefined,
                dataInicio ? new Date(dataInicio as string) : undefined,
                dataFim ? new Date(dataFim as string) : undefined
            );

            return res.status(200).json(agendamentos);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    criar = async (req: Request, res: Response) => {
        try {
            const { dataHoraInicio, dataHoraFim, clienteId, profissionalId, servicosIds, observacao, status } = req.body;

            if (!dataHoraInicio || !dataHoraFim || !profissionalId || !Array.isArray(servicosIds)) {
                return res.status(400).json({ error: 'Faltam parâmetros obrigatórios para o agendamento.' });
            }

            const novoAgendamento = await this.agendamentoService.criar({
                dataHoraInicio,
                dataHoraFim,
                clienteId: clienteId ? Number(clienteId) : undefined,
                profissionalId: Number(profissionalId),
                servicosIds: servicosIds.map(id => Number(id)),
                observacao,
                status: status as StatusAgendamento,
                ignorarAntecedencia: true // Vem do painel admin, ignora a regra de 30min
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

            const alterado = await this.agendamentoService.alterarStatus(id, status as StatusAgendamento);
            return res.status(200).json(alterado);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    deletar = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            await this.agendamentoService.deletar(id);
            return res.status(200).json({ message: 'Agendamento removido fisicamente com sucesso.' });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
