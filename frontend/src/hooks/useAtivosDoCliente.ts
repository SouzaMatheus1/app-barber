import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface Ativo {
  id: number;
  clienteId: number;
  tipoAtivoId: number;
  nome: string;
  ativo: boolean;
  criadoEm: string;
  veiculo?: {
    modelo: string;
    categoria: string;
    ano?: number;
    cor?: string;
    placa?: string;
  } | null;
  animal?: {
    especie: string;
    raca?: string;
    porte?: string;
  } | null;
}

export function useAtivosDoCliente(clienteId?: number | null) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recarregarAtivos = useCallback(async () => {
    if (!clienteId) {
      setAtivos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/clientes/${clienteId}/ativos`);
      setAtivos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao carregar ativos');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    recarregarAtivos();
  }, [recarregarAtivos]);

  return { ativos, loading, error, recarregarAtivos };
}
