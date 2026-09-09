import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangelogSino from '../ChangelogSino';

const mockContarNaoLidas = vi.fn();
const mockListar = vi.fn();
const mockMarcarVisualizado = vi.fn();

vi.mock('../../../services/ChangelogService', () => ({
  changelogService: {
    contarNaoLidas: (...args: unknown[]) => mockContarNaoLidas(...args),
    listar: (...args: unknown[]) => mockListar(...args),
    marcarVisualizado: (...args: unknown[]) => mockMarcarVisualizado(...args),
  },
}));

describe('Componente ChangelogSino', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContarNaoLidas.mockResolvedValue({ total: 0 });
    mockListar.mockResolvedValue([]);
    mockMarcarVisualizado.mockResolvedValue({});
  });

  it('exibe o badge com a contagem de não lidas ao carregar', async () => {
    mockContarNaoLidas.mockResolvedValue({ total: 3 });

    render(<ChangelogSino />);

    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('não exibe badge quando não há novidades não lidas', async () => {
    mockContarNaoLidas.mockResolvedValue({ total: 0 });

    render(<ChangelogSino />);

    await waitFor(() => expect(mockContarNaoLidas).toHaveBeenCalled());
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('ao clicar no sino, lista as entradas, marca como visualizado e zera o badge', async () => {
    mockContarNaoLidas.mockResolvedValue({ total: 2 });
    mockListar.mockResolvedValue([
      { id: 1, titulo: 'Nova funcionalidade', descricao: 'Descrição da novidade', publicadoEm: '2026-08-20T10:00:00.000Z', tipoEmpresaId: null },
    ]);

    render(<ChangelogSino />);

    const botaoSino = await screen.findByRole('button', { name: 'Novidades do sistema' });
    fireEvent.click(botaoSino);

    expect(await screen.findByText('Nova funcionalidade')).toBeInTheDocument();
    expect(screen.getByText('Descrição da novidade')).toBeInTheDocument();

    await waitFor(() => expect(mockMarcarVisualizado).toHaveBeenCalled());
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('fecha o painel ao clicar no botão de fechar', async () => {
    mockListar.mockResolvedValue([]);

    render(<ChangelogSino />);

    const botaoSino = await screen.findByRole('button', { name: 'Novidades do sistema' });
    fireEvent.click(botaoSino);

    expect(await screen.findByText('Nenhuma novidade por aqui ainda.')).toBeInTheDocument();

    const botoes = screen.getAllByRole('button');
    const botaoFechar = botoes[botoes.length - 1];
    fireEvent.click(botaoFechar);

    expect(screen.queryByText('Nenhuma novidade por aqui ainda.')).not.toBeInTheDocument();
  });
});
