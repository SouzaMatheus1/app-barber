import { api } from './api';

export const transacaoService = {
  getProfissionais: async () => {
    const response = await api.get('/profissionais');
    return response.data;
  },
  getClientes: async () => {
    const response = await api.get('/clientes');
    return response.data;
  },
  getCatalogo: async () => {
    const response = await api.get('/itens');
    return response.data;
  },
  create: async (data: {
    descricao?: string;
    tipoTransacaoId: number;
    profissionalId: number;
    clienteId?: number | null;
    itens: { itemId: number; quantidade: number; usouCreditoAssinatura: boolean }[];
  }) => {
    const response = await api.post('/transacoes', data);
    return response.data;
  }
};
