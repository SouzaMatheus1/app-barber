import { prisma } from '../database/prisma';
import { StatusAgendamento, Prisma } from '@prisma/client';
import { tenantStorage } from '../database/tenantContext';

export class AgendamentoService {

    /**
     * Retorna agendamentos de um profissional num intervalo de datas.
     * Útil pro calendário do painel.
     */
    async listar(profissionalId?: number, dataInicio?: Date, dataFim?: Date) {
        let whereClause: any = {};

        if (profissionalId) {
            whereClause.profissionalId = profissionalId;
        }

        if (dataInicio && dataFim) {
            whereClause.dataHoraInicio = { gte: dataInicio };
            whereClause.dataHoraFim = { lte: dataFim };
        }

        const agendamentos = await prisma.agendamento.findMany({
            where: whereClause,
            include: {
                cliente: { select: { id: true, nome: true, telefone: true } },
                profissional: { select: { id: true, nome: true } },
                servicos: { include: { item: true } }
            },
            orderBy: { dataHoraInicio: 'asc' }
        });

        return agendamentos;
    }

    /**
     * Cria um agendamento com verificação de colisão (Overbooking / Double Booking).
     * Transação com isolamento para segurança em concorrência.
     */
    async criar(data: {
        dataHoraInicio: string | Date;
        dataHoraFim: string | Date;
        clienteId?: number;
        profissionalId: number;
        servicosIds: number[];
        observacao?: string;
        status?: StatusAgendamento;
        ignorarAntecedencia?: boolean;
    }) {
        const datetimeInicio = new Date(data.dataHoraInicio);
        const datetimeFim = new Date(data.dataHoraFim);

        const antecedenciaMinima = new Date(Date.now() + 29 * 60000); // margem de 1min
        if (!data.ignorarAntecedencia && data.status !== 'INDISPONIVEL' && datetimeInicio < antecedenciaMinima) {
            throw new Error('Agendamentos devem ser feitos com no mínimo 30 minutos de antecedência.');
        }

        if (datetimeInicio >= datetimeFim) {
            throw new Error('A data de fim deve ser maior que a data de início.');
        }

        // Obtendo o contexto do multi-tenant (para injetar manualmente em sub-relacionamentos ou garantir robustez)
        const store = tenantStorage.getStore();
        const empresaId = store?.empresaId;

        if (!empresaId) throw new Error('Contexto de empresa não encontrado.');

        return await prisma.$transaction(async (tx) => { // $transaction: Se todas as operações dentro da transação tiverem sucesso, o Prisma confirma (commit). Caso contrário, desfaz (rollback).
            // 1. Verificar conflito de horários (Overlapping)
            // Retorna o primeiro agendamento que cruze a nova faixa de tempo.
            const overbooking = await tx.agendamento.findFirst({
                where: {
                    profissionalId: data.profissionalId,
                    status: {
                        in: ['CONFIRMADO', 'EM_ANDAMENTO', 'INDISPONIVEL']
                    },
                    AND: [
                        { dataHoraInicio: { lt: datetimeFim } },
                        { dataHoraFim: { gt: datetimeInicio } }
                    ]
                }
            });

            if (overbooking) {
                throw new Error('Horário indisponível! O profissional já possui um bloqueio ou agendamento neste horário.');
            }

            // 2. Criar agendamento e vincular serviços nxn
            const novoAgendamento = await tx.agendamento.create({
                data: {
                    empresaId, // Injeção garantida via transação
                    dataHoraInicio: datetimeInicio,
                    dataHoraFim: datetimeFim,
                    clienteId: data.clienteId,
                    profissionalId: data.profissionalId,
                    status: data.status || 'CONFIRMADO',
                    observacao: data.observacao,
                    servicos: {
                        create: data.servicosIds.map(itemId => ({
                            item: { connect: { id: itemId } }
                        }))
                    }
                },
                include: {
                    cliente: { select: { nome: true } },
                    servicos: { include: { item: true } }
                }
            });

            return novoAgendamento;
        }, {
            // Garante que nossa checagem no findFirst seja isolada até terminar o insert
            isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
        });
    }

    async alterarStatus(id: number, status: StatusAgendamento) {
        const agendamento = await prisma.agendamento.findUnique({ where: { id } });
        if (!agendamento) throw new Error('Agendamento não encontrado.');

        const updateData: any = { status };

        if (status === 'CONCLUIDO') {
            const now = new Date();
            if (agendamento.dataHoraFim > now) {
                updateData.dataHoraFim = now;
            }
        }

        const agendamentoAtualizado = await prisma.agendamento.update({
            where: { id },
            data: updateData
        });

        return agendamentoAtualizado;
    }

    async deletar(id: number) {
        return await prisma.agendamento.delete({
            where: { id }
        });
    }
}
