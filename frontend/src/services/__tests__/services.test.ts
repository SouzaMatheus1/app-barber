import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { ClienteService } from '../ClienteService';
import { dashboardService } from '../dashboardService';
import { authService } from '../authService';

describe('Serviços de API do Frontend', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ClienteService', () => {
    const clienteService = new ClienteService();

    it('deve listar clientes realizando chamada GET para /clientes', async () => {
      const mockClientes = [{ id: 1, nome: 'Matheus' }];
      const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockClientes });

      const result = await clienteService.listar();

      expect(spy).toHaveBeenCalledWith('/clientes');
      expect(result).toEqual(mockClientes);
    });

    it('deve buscar clientes realizando chamada GET com query param', async () => {
      const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: [] });

      await clienteService.search('Matheus');

      expect(spy).toHaveBeenCalledWith('/clientes/search?q=Matheus');
    });

    it('deve criar cliente realizando chamada POST', async () => {
      const novoCliente = { nome: 'João', telefone: '123' };
      const spy = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { id: 2, ...novoCliente } });

      const result = await clienteService.criar(novoCliente);

      expect(spy).toHaveBeenCalledWith('/clientes', novoCliente);
      expect(result.id).toBe(2);
    });

    it('deve editar cliente realizando chamada PUT', async () => {
      const dadosEdicao = { nome: 'João Alterado' };
      const spy = vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { id: 2, nome: 'João Alterado' } });

      const result = await clienteService.editar(2, dadosEdicao);

      expect(spy).toHaveBeenCalledWith('/clientes/2', dadosEdicao);
      expect(result.nome).toBe('João Alterado');
    });

    it('deve deletar cliente realizando chamada DELETE', async () => {
      const spy = vi.spyOn(api, 'delete').mockResolvedValueOnce({});

      await clienteService.deletar(2);

      expect(spy).toHaveBeenCalledWith('/clientes/2');
    });
  });

  describe('dashboardService', () => {
    it('deve buscar resumo diário com a data parametrizada', async () => {
      const mockResumo = { faturamento: 100 };
      const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockResumo });

      const result = await dashboardService.getResumoDiario('2026-06-25');

      expect(spy).toHaveBeenCalledWith('/caixa/diario?data=2026-06-25');
      expect(result).toEqual(mockResumo);
    });

    it('deve buscar transações do dia', async () => {
      const mockTransacoes = [{ id: 1 }];
      const spy = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockTransacoes });

      const result = await dashboardService.getTransacoes();

      expect(spy).toHaveBeenCalledWith('/transacoes');
      expect(result).toEqual(mockTransacoes);
    });
  });

  describe('authService', () => {
    it('deve realizar login do profissional', async () => {
      const spy = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { token: 'prof-token' } });

      const result = await authService.login('admin@barber.com', '123');

      expect(spy).toHaveBeenCalledWith('/login', { email: 'admin@barber.com', senha: '123' });
      expect(result).toEqual({ token: 'prof-token' });
    });
  });
});
