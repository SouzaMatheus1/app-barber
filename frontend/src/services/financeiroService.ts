import { api } from './api';

export const financeiroService = {
  /**
   * Obtém o fluxo de caixa diário (snapshots) para um determinado período.
   * Útil para plotar gráficos de evolução de saldo, receitas e despesas.
   */
  async getFluxoCaixa(dataInicial: string, dataFinal: string) {
    const response = await api.get(`/financeiro/fluxo-caixa`, {
      params: { dataInicial, dataFinal }
    });
    return response.data;
  }
};
