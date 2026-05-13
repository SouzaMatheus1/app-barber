import { api } from './api';

export const relatorioService = {
  /**
   * Obtém a inteligência de vendas de produtos/serviços agregada.
   * Traz a quantidade e receita total de cada item no período.
   */
  async getVendasProdutos(dataInicial: string, dataFinal: string) {
    const response = await api.get(`/relatorios/vendas-produtos`, {
      params: { dataInicial, dataFinal }
    });
    return response.data;
  }
};
