import { api } from './api';

export interface ChangelogEntry {
  id: number;
  titulo: string;
  descricao: string;
  publicadoEm: string;
  tipoEmpresaId: number | null;
}

export const changelogService = {
  listar: async (): Promise<ChangelogEntry[]> => {
    const res = await api.get('/changelog');
    return res.data;
  },
  contarNaoLidas: async (): Promise<{ total: number }> => {
    const res = await api.get('/changelog/nao-lidas');
    return res.data;
  },
  marcarVisualizado: async () => {
    const res = await api.post('/changelog/marcar-visualizado');
    return res.data;
  }
};
