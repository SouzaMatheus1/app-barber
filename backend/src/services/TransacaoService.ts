import { prisma } from '../database/prisma';
import { ItemTransacao, statusAssinatura } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { tenantStorage } from '../database/tenantContext';

export class TransacaoService {
    async listAll(){
        const transacoes = await prisma.transacao.findMany({
            include: {
                tipo: true,
                metodoPagamento: true,
                profissional: { select: { id: true, nome: true } },
                cliente: { select: { id: true, nome: true } },
                itens: {
                    include: { // para fazer o join
                        item: { select: { id: true, nome: true, tipo: true } }
                    }
                }
            },
            orderBy: { data: 'desc' }
        });

        return transacoes;
    }

    private async syncFechamentoCaixa(tx: any, dataStr: Date | string) {
        const store = tenantStorage.getStore();
        if (!store?.empresaId) return;
        const empresaId = store.empresaId;

        const dataObj = new Date(dataStr);
        // Normaliza para o início do dia no UTC local para alinhar com banco
        const data = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
        const dataFim = new Date(data.getTime() + 24 * 60 * 60 * 1000);

                const transacoesDoDia = await tx.transacao.findMany({
            where: {
                empresaId,
                data: {
                    gte: data,
                    lt: dataFim
                }
            }
        });

        let receitas = 0;
        let despesas = 0;

        transacoesDoDia.forEach((t: any) => {
            if (t.tipoTransacaoId === 2) { // SAIDA
                despesas += Number(t.valorTotal);
            } else { // ENTRADA
                receitas += Number(t.valorTotal);
            }
        });

        const saldoFinal = receitas - despesas;

        await tx.fechamentoCaixa.upsert({
            where: {
                empresaId_data: { empresaId, data }
            },
            create: {
                empresaId,
                data,
                saldoInicial: 0,
                receitas,
                despesas,
                saldoFinal
            },
            update: {
                receitas,
                despesas,
                saldoFinal
            }
        });
    }

    async create(dataParams: {
        descricao?: string,
        tipoTransacaoId: number,
        profissionalId: number,
        formaPagamentoId?: number,
        data?: Date,
        clienteId?: number,
        categoriaCustoId?: number,
        valorTotal?: number, // Para despesas diretas
        ativoId?: number,
        itens?: { itemId: number, quantidade: number, usouCreditoAssinatura?: boolean } []
    }){
        const { descricao, tipoTransacaoId, profissionalId, clienteId, itens, formaPagamentoId, categoriaCustoId, valorTotal, ativoId } = dataParams;
        const store = tenantStorage.getStore();

        // Validação: profissional é obrigatório para ENTRADAS (atendimento)
        if (tipoTransacaoId === 1 && !profissionalId) {
            throw new AppError("O profissional é obrigatório para registros de atendimento.", 400);
        }

        // Validação de titularidade do ativo
        if (ativoId) {
            if (!clienteId) {
                throw new AppError("Cliente é obrigatório para vincular um ativo ao agendamento.", 400);
            }
            const ativo = await prisma.ativo.findFirst({
                where: { id: ativoId, clienteId }
            });
            if (!ativo) {
                throw new AppError("O ativo informado não pertence ao cliente.", 400);
            }
        }

        const itensId = (itens || []).map(item => item.itemId);

        const itensBd = itensId.length > 0 
            ? await prisma.itemCatalogo.findMany({ where: { id: { in: itensId } } })
            : [];

        if (itens && itens.length !== itensBd.length)
            throw new AppError("Um ou mais itens não estão cadastrados no catálogo.", 400);

        let totalVenda = valorTotal || 0;
        let requiresCredits = false;
        
        let assinaturaAtiva = null;
        if (clienteId) {
            assinaturaAtiva = await prisma.assinatura.findFirst({
                where: { clienteId, status: statusAssinatura.ATIVA },
                include: { 
                    creditos: true,
                    plano: { include: { itens: true } }
                }
            });
        }

        const creditosParaAtualizar: { id: number, novaQuantidade: number }[] = [];

        const itensSelecionados = (itens || []).map(itemRegistrado => {
            const itemSalvo = itensBd.find((itemBd: any) => itemBd.id == itemRegistrado.itemId);
            let valorItem = Number(itemSalvo?.preco);
            
            const usouCredito = itemRegistrado.usouCreditoAssinatura || false;
            
            if (usouCredito) {
               requiresCredits = true;
               if (!assinaturaAtiva) {
                   throw new AppError("O cliente marcou o uso de crédito mas não possui assinatura ativa no momento.", 400);
               }
               
               const creditoEncontrado = assinaturaAtiva.creditos.find(c => c.itemId === itemRegistrado.itemId);
               
               if (!creditoEncontrado) {
                   throw new AppError(`O plano do cliente não inclui o serviço: ${itemSalvo?.nome}`, 400);
               }

               if (creditoEncontrado.quantidadeRestante < itemRegistrado.quantidade) {
                   throw new AppError(`Saldo insuficiente para o serviço: ${itemSalvo?.nome}. Restante: ${creditoEncontrado.quantidadeRestante}`, 400);
               }

               // Registrar para atualização posterior (dentro da transaction)
               const jaRegistrado = creditosParaAtualizar.find(c => c.id === creditoEncontrado.id);
               if (jaRegistrado) {
                   jaRegistrado.novaQuantidade -= itemRegistrado.quantidade;
               } else {
                   creditosParaAtualizar.push({
                       id: creditoEncontrado.id,
                       novaQuantidade: creditoEncontrado.quantidadeRestante - itemRegistrado.quantidade
                   });
               }

               // Cálculo proporcional: Mensalidade / Total de créditos no plano
               const itensPlano = assinaturaAtiva.plano.itens || [];
               const totalItensNoPlano = itensPlano.reduce((sum, ip) => sum + ip.quantidade, 0);
               const mensalidade = Number(assinaturaAtiva.plano.valorMensal || 0);
               
               const valorProporcional = totalItensNoPlano > 0 ? mensalidade / totalItensNoPlano : 0;
               valorItem = valorProporcional; // Usar valor proporcional p/ o ItemTransacao
            }

            // Para o totalVenda do Caixa, se usou crédito, a contribuição financeira é 0
            if (!usouCredito) {
                totalVenda += valorItem * itemRegistrado.quantidade;
            }

            return {
                quantidade: itemRegistrado.quantidade,
                precoUnitario: valorItem,
                usouCreditoAssinatura: usouCredito,
                itemId: itemRegistrado.itemId,
                empresaId: store?.empresaId ?? 1
            }
        });

        const empresaIdAtual = store?.empresaId ?? 1;

        /**
         * @function Execução do Fluxo Contábil (Transaction)
         * - Esta transação garante integridade (ACID). Se falhar durante a criação, o saldo do cliente não é retirado de forma fantasma.
         * - Se existirem créditos para serem descontados, atualizamos a entidade 'CreditoAssinatura' para não permitir dupla redução do saldo limitando o total para os próximos pedidos.
         * - Utilizamos valores proporcionais para o item quando `usouCredito` for preenchido a fim de estipularmos no Demonstrativo Financeiro (Caixa) que o serviço teve um custo fixado da mensalidade embutido, em vez de ser estritamente 'R$ 0.00'.
         */
        const transacao = await prisma.$transaction(async (tx) => {
            const trx = await tx.transacao.create({
                data: {
                    empresaId: empresaIdAtual,
                    valorTotal: totalVenda,
                    descricao,
                    data: dataParams.data ? new Date(dataParams.data) : new Date(),
                    tipoTransacaoId,
                    profissionalId: profissionalId || null,
                    clienteId: clienteId || null,
                    formaPagamentoId: formaPagamentoId || null,
                    categoriaCustoId: categoriaCustoId || null,
                    ativoId: ativoId || null,
                    itens: {
                        create: itensSelecionados
                    }
                }
            });
            
            if (requiresCredits && creditosParaAtualizar.length > 0) {
                for (const cred of creditosParaAtualizar) {
                    await tx.creditoAssinatura.update({
                        where: { id: cred.id },
                        data: { quantidadeRestante: cred.novaQuantidade }
                    });
                }
            }

            await this.syncFechamentoCaixa(tx, trx.data);

            return trx;
        });

        return transacao;
    }

    async edit(id: number, dataParams: {
        descricao?: string,
        valorTotal?: number,
        tipoTransacaoId?: number,
        profissionalId?: number,
        formaPagamentoId?: number,
        clienteId?: number,
        data?: Date
    }){
        const transacao = await prisma.transacao.findUnique({
            where: { id }
        });

        if(!transacao)
            throw new AppError('Registro não encontrado', 404);

        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.transacao.update({
                where: { id },
                data: {
                    ...(dataParams.descricao && { descricao: dataParams.descricao }),
                    ...(dataParams.valorTotal !== undefined && { valorTotal: dataParams.valorTotal }),
                    ...(dataParams.tipoTransacaoId && { tipoTransacaoId: dataParams.tipoTransacaoId }),
                    ...(dataParams.profissionalId && { profissionalId: dataParams.profissionalId }),
                    ...(dataParams.clienteId && { clienteId: dataParams.clienteId }),
                    ...(dataParams.formaPagamentoId && { formaPagamentoId: dataParams.formaPagamentoId }),
                    ...(dataParams.data && { data: new Date(dataParams.data) })
                },
                select: {
                    descricao: true,
                    valorTotal: true,
                    tipoTransacaoId: true,
                    profissionalId: true,
                    clienteId: true,
                    data: true
                }
            });

            await this.syncFechamentoCaixa(tx, updated.data);
            
            // Se a data mudou, também precisamos sincronizar a data antiga
            if (dataParams.data && new Date(dataParams.data).getDate() !== transacao.data.getDate()) {
                await this.syncFechamentoCaixa(tx, transacao.data);
            }

            return updated;
        });

        return result;
    }

    async delete(id: number) {
        const transacao = await prisma.transacao.findUnique({
            where: { id }
        });

        if (!transacao)
            throw new AppError('Transação não encontrada', 404);

        await prisma.$transaction(async (tx) => {
            await tx.itemTransacao.deleteMany({ where: { transacaoId: id } });
            await tx.transacao.delete({ where: { id } });
            await this.syncFechamentoCaixa(tx, transacao.data);
        });

        return { message: 'Transação e itens excluídos com sucesso' };
    }
}