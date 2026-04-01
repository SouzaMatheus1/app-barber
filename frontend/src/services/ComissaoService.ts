import { api } from './api';

export const comissaoService = {
  relatorio: async (profissionalId: number, dataInicio?: string, dataFim?: string) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/comissoes/profissional/${profissionalId}${qs}`);
    return response.data;
  }
};
