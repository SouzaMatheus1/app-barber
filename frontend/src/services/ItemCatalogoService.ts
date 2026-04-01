import { api } from './api';

export const itemCatalogoService = {
  listar: async () => {
    const response = await api.get('/itens');
    return response.data;
  },
  criar: async (data: any) => {
    const response = await api.post('/itens', data);
    return response.data;
  },
  editar: async (id: number, data: any) => {
    const response = await api.put(`/itens/${id}`, data);
    return response.data;
  },
  deletar: async (id: number) => {
    const response = await api.delete(`/itens/${id}`);
    return response.data;
  }
};
