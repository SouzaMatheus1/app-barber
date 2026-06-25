import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Custos from '../Custos';
import { transacaoService } from '../../../services/TransacaoService';
import { categoriaCustoService } from '../../../services/CategoriaCustoService';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/TransacaoService', () => ({
  transacaoService: {
    listar: vi.fn(),
    create: vi.fn(),
    deletar: vi.fn()
  }
}));

vi.mock('../../../services/CategoriaCustoService', () => ({
  categoriaCustoService: {
    listar: vi.fn(),
    criar: vi.fn(),
    deletar: vi.fn()
  }
}));

describe('Página Custos', () => {
  const mockCategorias = [
    { id: 1, descricao: 'Aluguel' },
    { id: 2, descricao: 'Energia' }
  ];

  const mockHistorico = [
    {
      id: 10,
      data: '2026-06-19T10:00:00.000Z',
      descricao: 'Pagamento Aluguel',
      tipoTransacaoId: 2,
      categoriaCustoId: 1,
      categoriaCusto: { id: 1, descricao: 'Aluguel' },
      valorTotal: 1200.00
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (categoriaCustoService.listar as any).mockResolvedValue(mockCategorias);
    (transacaoService.listar as any).mockResolvedValue(mockHistorico);
  });

  it('deve renderizar o formulário de lançamento de despesa', async () => {
    render(
      <MemoryRouter>
        <Custos />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Gestão de Custos/i })).toBeInTheDocument();
    
    // Espera as categorias carregarem no select
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Aluguel' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Energia' })).toBeInTheDocument();
    });
  });

  it('deve permitir submeter nova despesa com sucesso', async () => {
    (transacaoService.create as any).mockResolvedValueOnce({ id: 11 });
    
    render(
      <MemoryRouter>
        <Custos />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Aluguel' })).toBeInTheDocument();
    });

    const inputValor = screen.getByPlaceholderText('35.00');
    fireEvent.change(inputValor, { target: { value: '150.00' } });

    const inputDesc = screen.getByPlaceholderText(/Ex: Pagamento de aluguel/i);
    fireEvent.change(inputDesc, { target: { value: 'Energia de Maio' } });

    // Seleciona Categoria "Energia"
    const selects = screen.getAllByRole('combobox');
    const selectCategoria = selects[0];
    fireEvent.change(selectCategoria, { target: { value: '2' } }); // Energia

    const btnSubmit = screen.getByRole('button', { name: /Finalizar Lançamento/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(transacaoService.create).toHaveBeenCalledWith(expect.objectContaining({
        descricao: 'Energia de Maio',
        valorTotal: 150,
        tipoTransacaoId: 2,
        categoriaCustoId: 2
      }));
      expect(screen.getByText('Lançado com Sucesso!')).toBeInTheDocument();
    });
  });

  it('deve mudar de aba para Histórico e listar despesas', async () => {
    render(
      <MemoryRouter>
        <Custos />
      </MemoryRouter>
    );

    const tabHistorico = screen.getByRole('button', { name: /Histórico/i });
    fireEvent.click(tabHistorico);

    await waitFor(() => {
      expect(screen.getByText('Pagamento Aluguel')).toBeInTheDocument();
      expect(screen.getByText('- R$ 1.200,00')).toBeInTheDocument();
    });
  });

  it('deve mudar de aba para Categorias e permitir cadastrar nova categoria', async () => {
    (categoriaCustoService.criar as any).mockResolvedValueOnce({ id: 3, descricao: 'Internet' });
    
    render(
      <MemoryRouter>
        <Custos />
      </MemoryRouter>
    );

    const tabCategorias = screen.getByRole('button', { name: /Categorias/i });
    fireEvent.click(tabCategorias);

    await waitFor(() => {
      expect(screen.getByText('Aluguel')).toBeInTheDocument();
      expect(screen.getByText('Energia')).toBeInTheDocument();
    });

    const inputNovaCat = screen.getByPlaceholderText(/Ex: Aluguel, Luz, Marketing/i);
    fireEvent.change(inputNovaCat, { target: { value: 'Internet' } });

    const btnAdd = screen.getByRole('button', { name: /Adicionar Categoria/i });
    fireEvent.click(btnAdd);

    await waitFor(() => {
      expect(categoriaCustoService.criar).toHaveBeenCalledWith('Internet');
    });
  });
});
