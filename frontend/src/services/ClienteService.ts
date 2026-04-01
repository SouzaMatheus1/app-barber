import { api } from './api';

export interface Cliente {
  id: string | number
  nome: string
  telefone: string | null
  criadoEm: string
  assinaturas?: {
    planoId: number,
    plano: {
      id: number,
      nome: string
    }
  }[]
}

export class ClienteService {
  async listar(): Promise<Cliente[]> {
    const response = await api.get('/clientes')
    return response.data
  }

  async search(query: string): Promise<Cliente[]> {
    const response = await api.get(`/clientes/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  async criar(data: { nome: string; telefone?: string; planoId?: number }): Promise<Cliente> {
    const response = await api.post('/clientes', data)
    return response.data
  }

  async editar(id: number, data: { nome?: string; telefone?: string; planoId?: number }): Promise<Cliente> {
    const response = await api.put(`/clientes/${id}`, data)
    return response.data
  }

  async deletar(id: number): Promise<void> {
    await api.delete(`/clientes/${id}`)
  }
}