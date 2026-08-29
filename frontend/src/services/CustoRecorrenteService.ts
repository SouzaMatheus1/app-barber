import { api } from './api';
import type { CategoriaCusto } from './CategoriaCustoService';

export interface CustoRecorrente {
    id: number;
    descricao: string;
    valor: number;
    diaVencimento: number;
    categoriaCustoId: number | null;
    categoriaCusto: CategoriaCusto | null;
    ativo: boolean;
    dataUltimoPagamento: string | null;
    dataProximoVencimento: string | null;
}

export interface CustoRecorrenteInput {
    descricao: string;
    valor: number;
    diaVencimento: number;
    categoriaCustoId?: number | null;
}

export const custoRecorrenteService = {
    async listar() {
        const response = await api.get<CustoRecorrente[]>('/custos-recorrentes');
        return response.data;
    },

    async criar(data: CustoRecorrenteInput) {
        const response = await api.post<CustoRecorrente>('/custos-recorrentes', data);
        return response.data;
    },

    async editar(id: number, data: Partial<CustoRecorrenteInput>) {
        const response = await api.put<CustoRecorrente>(`/custos-recorrentes/${id}`, data);
        return response.data;
    },

    async deletar(id: number) {
        const response = await api.delete(`/custos-recorrentes/${id}`);
        return response.data;
    },

    async lancarPagamento(id: number) {
        const response = await api.post<CustoRecorrente>(`/custos-recorrentes/${id}/lancar`);
        return response.data;
    }
};
