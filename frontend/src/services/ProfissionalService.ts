import { api } from './api';

export const profissionalService = {
  listar: async () => {
    const response = await api.get('/profissionais');
    return response.data;
  },
  criar: async (data: any) => {
    const response = await api.post('/profissionais', data);
    return response.data;
  },
  editar: async (id: number, data: any) => {
    const response = await api.put(`/profissionais/${id}`, data);
    return response.data;
  },
  deletar: async (id: number) => {
    const response = await api.delete(`/profissionais/${id}`);
    return response.data;
  }
};
