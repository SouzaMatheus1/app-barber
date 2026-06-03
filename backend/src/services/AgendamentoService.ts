import { prisma } from '../database/prisma';
import { StatusAgendamento, Prisma } from '@prisma/client';
import { tenantStorage } from '../database/tenantContext';

export class AgendamentoService {

    /**
     * Retorna agendamentos de um profissional num intervalo de datas.
     * Útil pro calendário do painel.
     */
    async listar(profissionalId?: number, dataInicio?: Date, dataFim?: Date, clienteId?: number) {
        let whereClause: any = {};

        if (profissionalId) {
            whereClause.profissionalId = profissionalId;
        }

        if (clienteId) {
            whereClause.clienteId = clienteId;
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
        usarCreditos?: boolean;
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

        let observacaoComCreditos = data.observacao;

        return await prisma.$transaction(async (tx) => { // $transaction: Se todas as operações dentro da transação tiverem sucesso, o Prisma confirma (commit). Caso contrário, desfaz (rollback).
            // 1. Verificar conflito de horários (Overlapping)
            // Retorna o primeiro agendamento que cruze a nova faixa de tempo.
            const overbooking = await tx.agendamento.findFirst({
                where: {
                    empresaId,
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

            // Validar e consumir créditos se solicitado
            if (data.usarCreditos) {
                if (!data.clienteId) {
                    throw new Error('Cliente é obrigatório para utilizar créditos de assinatura.');
                }
                const assinaturaAtiva = await tx.assinatura.findFirst({
                    where: { clienteId: data.clienteId, status: 'ATIVA', empresaId },
                    include: { creditos: true }
                });

                if (!assinaturaAtiva) {
                    throw new Error('Você não possui nenhuma assinatura ativa para utilizar créditos.');
                }

                for (const itemId of data.servicosIds) {
                    const credito = assinaturaAtiva.creditos.find(c => c.itemId === itemId);
                    if (!credito || credito.quantidadeRestante <= 0) {
                        const item = await tx.itemCatalogo.findFirst({ where: { id: itemId, empresaId } });
                        throw new Error(`Saldo de créditos insuficiente para o serviço: ${item?.nome || itemId}.`);
                    }
                    // Decrementar
                    await tx.creditoAssinatura.update({
                        where: { id: credito.id },
                        data: { quantidadeRestante: { decrement: 1 } }
                    });
                }

                const tag = '[Crédito de Assinatura Consumido]';
                observacaoComCreditos = observacaoComCreditos ? `${tag} ${observacaoComCreditos}` : tag;
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
                    observacao: observacaoComCreditos,
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
        const agendamento = await prisma.agendamento.findUnique({ 
            where: { id },
            include: { servicos: true }
        });
        if (!agendamento) throw new Error('Agendamento não encontrado.');

        const updateData: any = { status };

        if (status === 'CONCLUIDO') {
            const now = new Date();
            if (agendamento.dataHoraFim > now) {
                updateData.dataHoraFim = now;
            }
        }

        return await prisma.$transaction(async (tx) => {
            // Se estiver cancelando e tinha consumido créditos de assinatura, faz o estorno
            if (status === 'CANCELADO' && agendamento.status !== 'CANCELADO') {
                const consumiuCredito = agendamento.observacao?.includes('[Crédito de Assinatura Consumido]');
                if (consumiuCredito && agendamento.clienteId) {
                    const assinaturaAtiva = await tx.assinatura.findFirst({
                        where: { clienteId: agendamento.clienteId, status: 'ATIVA', empresaId: agendamento.empresaId }
                    });

                    if (assinaturaAtiva) {
                        for (const servico of agendamento.servicos) {
                            const credito = await tx.creditoAssinatura.findFirst({
                                where: {
                                    empresaId: agendamento.empresaId,
                                    assinaturaId: assinaturaAtiva.id,
                                    itemId: servico.itemId
                                }
                            });
                            if (credito) {
                                await tx.creditoAssinatura.update({
                                    where: { id: credito.id },
                                    data: { quantidadeRestante: { increment: 1 } }
                                });
                            }
                        }
                        const tagEstorno = '[Crédito Estornado]';
                        updateData.observacao = agendamento.observacao 
                            ? `${tagEstorno} ${agendamento.observacao.replace('[Crédito de Assinatura Consumido]', '').trim()}`
                            : tagEstorno;
                    }
                }
            }

            const agendamentoAtualizado = await tx.agendamento.update({
                where: { id },
                data: updateData
            });

            return agendamentoAtualizado;
        });
    }

    async deletar(id: number) {
        return await prisma.agendamento.delete({
            where: { id }
        });
    }

    async getDisponibilidade(profissionalId: number, dataStr: string, duracaoMinutos: number) {
        // Encontra todos os agendamentos do profissional na data selecionada
        const dataInicio = new Date(`${dataStr}T00:00:00`);
        const dataFim = new Date(`${dataStr}T23:59:59`);

        const agendamentos = await prisma.agendamento.findMany({
            where: {
                profissionalId,
                status: {
                    in: ['CONFIRMADO', 'EM_ANDAMENTO', 'INDISPONIVEL']
                },
                dataHoraInicio: {
                    gte: dataInicio
                },
                dataHoraFim: {
                    lte: dataFim
                }
            },
            orderBy: {
                dataHoraInicio: 'asc'
            }
        });

        // Horário de funcionamento: 08:00 às 20:00
        const horaAbertura = 8;
        const horaFechamento = 20;

        const slotsDisponiveis: string[] = [];
        const agora = new Date();
        const antecedenciaMinima = new Date(Date.now() + 29 * 60 * 1000); // 29 minutos no futuro

        // Gerar slots de 15 em 15 minutos
        for (let hora = horaAbertura; hora < horaFechamento; hora++) {
            for (const minuto of [0, 15, 30, 45]) {
                const slotStart = new Date(dataInicio);
                slotStart.setHours(hora, minuto, 0, 0);

                const slotEnd = new Date(slotStart.getTime() + duracaoMinutos * 60 * 1000);

                // Se o slot terminar depois do horário de fechamento, ignora
                const limiteFechamento = new Date(dataInicio);
                limiteFechamento.setHours(horaFechamento, 0, 0, 0);
                if (slotEnd > limiteFechamento) {
                    continue;
                }

                // Se for hoje, o slot deve respeitar a antecedência mínima
                if (slotStart < antecedenciaMinima) {
                    continue;
                }

                // Verifica se há colisão com algum agendamento existente
                const hasOverlap = agendamentos.some(ag => {
                    const agStart = new Date(ag.dataHoraInicio);
                    const agEnd = new Date(ag.dataHoraFim);
                    return agStart < slotEnd && agEnd > slotStart;
                });

                if (!hasOverlap) {
                    const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
                    slotsDisponiveis.push(horaFormatada);
                }
            }
        }

        return slotsDisponiveis;
    }
}
