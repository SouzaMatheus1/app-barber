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
    profissionalId?: number | null;
    clienteId?: number | null;
    formaPagamentoId?: number;
    data?: string;
    valorTotal?: number;
    categoriaCustoId?: number | null;
    ativoId?: number | null;
    itens?: { itemId: number; quantidade: number; usouCreditoAssinatura: boolean }[];
  }) => {
    const response = await api.post('/transacoes', data);
    return response.data;
  },
  listar: async () => {
    const response = await api.get('/transacoes');
    return response.data;
  },
  editar: async (id: number, data: any) => {
    const response = await api.put(`/transacoes/${id}`, data);
    return response.data;
  },
  deletar: async (id: number) => {
    const response = await api.delete(`/transacoes/${id}`);
    return response.data;
  }
};
