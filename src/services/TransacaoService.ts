import { prisma } from '../database/prisma';

export class TransacaoService {
    async listAll(){
        const transacoes = await prisma.transacao.findMany({
            include: {
                tipo: true,
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

    async create(data: {
        descricao: string,
        valorTotal: number,
        tipoTransacaoId: number,
        profissionalId: number,
        clienteId: number,
        itens: { itemId: number, quantidade: number, precoUnitario:number } []
    }){

    }
}