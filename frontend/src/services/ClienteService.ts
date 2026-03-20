import { api } from './api';

export interface Cliente {
    id: Number,
    nome: string,
    telefone: string,
    criadoEm: string
}

export class ClienteService {
  async listar(): Promise<Cliente[]> {
    const response = await api.get('/clientes')
    return response.data
  }

  async criar(data: { nome: string; telefone?: string }): Promise<Cliente> {
    const response = await api.post('/clientes', data)
    return response.data
  }

  async editar(id: number, data: { nome?: string; telefone?: string }): Promise<Cliente> {
    const response = await api.put(`/clientes/${id}`, data)
    return response.data
  }

  async deletar(id: number): Promise<void> {
    await api.delete(`/clientes/${id}`)
  }
}