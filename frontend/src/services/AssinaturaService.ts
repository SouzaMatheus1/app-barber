import { api } from './api';

export const assinaturaService = {
  getPlanos: async () => {
    const res = await api.get('/planos');
    return res.data;
  },
  createPlano: async (payload: any) => {
    const res = await api.post('/planos', payload);
    return res.data;
  },
  editPlano: async (id: number, payload: any) => {
    const res = await api.put(`/planos/${id}`, payload);
    return res.data;
  },
  deletePlano: async (id: number) => {
    const res = await api.delete(`/planos/${id}`);
    return res.data;
  },
  getAssinaturas: async () => {
    const res = await api.get('/assinaturas');
    return res.data;
  },
  assinar: async (payload: any) => {
    const res = await api.post('/assinaturas', payload);
    return res.data;
  },
  getAssinaturaAtiva: async (clienteId: number) => {
    const res = await api.get(`/assinaturas/cliente/${clienteId}/ativa`);
    return res.data;
  }
};
