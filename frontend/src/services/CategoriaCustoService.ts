import { api } from './api';

export interface CategoriaCusto {
    id: number;
    descricao: string;
}

export const categoriaCustoService = {
    async listar() {
        const response = await api.get<CategoriaCusto[]>('/categorias-custo');
        return response.data;
    },

    async criar(descricao: string) {
        const response = await api.post<CategoriaCusto>('/categorias-custo', { descricao });
        return response.data;
    },

    async editar(id: number, descricao: string) {
        const response = await api.put<CategoriaCusto>(`/categorias-custo/${id}`, { descricao });
        return response.data;
    },

    async deletar(id: number) {
        const response = await api.delete(`/categorias-custo/${id}`);
        return response.data;
    }
};
