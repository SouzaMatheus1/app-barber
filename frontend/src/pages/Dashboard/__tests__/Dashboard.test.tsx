import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';
import { dashboardService } from '../../../services/dashboardService';

// Mock do serviço
vi.mock('../../../services/dashboardService', () => ({
  dashboardService: {
    getResumoDiario: vi.fn(),
    getTransacoes: vi.fn(),
    getClientes: vi.fn(),
  },
}));

describe('Página Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir um carregamento inicial e depois os dados corretos', async () => {
    // Mocks Returns
    (dashboardService.getResumoDiario as any).mockResolvedValueOnce({
      movimentoDia: { faturamentoTotal: 500.5 },
      quantidadeTransacoes: 10,
    });

    (dashboardService.getTransacoes as any).mockResolvedValueOnce([
      {
        id: 1,
        cliente: { nome: 'João da Silva' },
        itens: [{ item: { nome: 'Corte Social' } }],
        valorTotal: '50.00',
        profissional: { nome: 'Admin' },
        data: new Date().toISOString()
      }
    ]);

    (dashboardService.getClientes as any).mockResolvedValueOnce([{}, {}, {}]); // 3 clientes

    render(<Dashboard />);

    // Loader está na tela inicialmente? 
    // Wait for disappear é feito esperando aparecer os titulos
    await waitFor(() => {
      // Metric titles
      expect(screen.getByText('Faturamento do Dia')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 500,50/i)).toBeInTheDocument();
      
      expect(screen.getByText('Cortes Realizados')).toBeInTheDocument();
      
      // Ticket médio (500.5 / 10 = 50.05)
      expect(screen.getByText('Ticket Médio')).toBeInTheDocument();
      expect(screen.getByText(/R\$ 50,05/i)).toBeInTheDocument();

      // Total Clientes (3)
      expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Recentes da Table
      expect(screen.getByText('João da Silva')).toBeInTheDocument();
      expect(screen.getByText('Corte Social')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  it('deve lidar com falhas nos serviços amigavelmente (exibindo vazio ou console erro)', async () => {
    // Se der erro, ele faz console.error() e exibe metricas como zeros.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (dashboardService.getResumoDiario as any).mockRejectedValueOnce(new Error('Erro backend'));
    (dashboardService.getTransacoes as any).mockResolvedValueOnce([]);
    (dashboardService.getClientes as any).mockResolvedValueOnce([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('WS Barber Shop')).toBeInTheDocument(); // Title is there, loading finished
    });

    expect(consoleSpy).toHaveBeenCalledWith("Erro ao carregar os dados do dashboard", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
