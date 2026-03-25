import { api } from './api';

export const dashboardService = {
  async getResumoDiario(data: string) {
    const response = await api.get(`/caixa/diario?data=${data}`);
    return response.data; // Espera ter { totalServicos, totalProdutos, faturamentoGeral } ou semelhante
  },
  
  async getTransacoes() {
    const response = await api.get('/transacoes');
    return response.data;
  },

  async getClientes() {
    const response = await api.get('/clientes');
    return response.data;
  }
};
