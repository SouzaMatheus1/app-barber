import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agenda } from '../Agenda';
import { api } from '../../../services/api';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Página Agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar dados básicos e renderizar a agenda corretamente', async () => {
    const mockProfissionais = [{ id: 1, nome: 'João Barbeiro' }];
    const mockItens = [{ id: 1, nome: 'Corte', tipo: { descricao: 'SERVICO' } }];
    const mockClientes = [{ id: 1, nome: 'Cliente 1' }];
    const mockAgendamentos = [
      {
        id: 1,
        dataHoraInicio: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        dataHoraFim: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
        status: 'CONFIRMADO',
        profissionalId: 1,
        profissional: { nome: 'João Barbeiro' },
        cliente: { nome: 'Cliente 1' },
      }
    ];

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/profissionais') return Promise.resolve({ data: mockProfissionais });
      if (url === '/itens') return Promise.resolve({ data: mockItens });
      if (url === '/clientes') return Promise.resolve({ data: mockClientes });
      if (url.startsWith('/agendamentos')) return Promise.resolve({ data: mockAgendamentos });
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <Agenda />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Agenda Diária')).toBeInTheDocument();
      expect(screen.getByText('João Barbeiro')).toBeInTheDocument();
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
      expect(screen.getByText('Confirmado')).toBeInTheDocument();
    });
  });

  it('deve abrir modal de novo agendamento e permitir salvar', async () => {
    const mockProfissionais = [{ id: 1, nome: 'João Barbeiro' }];
    const mockItens = [{ id: 1, nome: 'Corte', tipo: { descricao: 'SERVICO' } }];
    const mockClientes = [{ id: 1, nome: 'Cliente 1' }];
    
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/profissionais') return Promise.resolve({ data: mockProfissionais });
      if (url === '/itens') return Promise.resolve({ data: mockItens });
      if (url === '/clientes') return Promise.resolve({ data: mockClientes });
      if (url.startsWith('/agendamentos')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    (api.post as any).mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <Agenda />
      </MemoryRouter>
    );

    const btnNovo = screen.getByRole('button', { name: /Novo Agendamento/i });
    fireEvent.click(btnNovo);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Agendar Serviço/i })).toBeInTheDocument();
    });

    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    const inputCliente = screen.getByPlaceholderText('Selecione ou digite um nome avulso');
    fireEvent.change(inputCliente, { target: { value: 'Novo Cliente Avulso' } });

    const btnSubmit = screen.getByRole('button', { name: /Agendar Serviço/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/agendamentos', expect.objectContaining({
        profissionalId: 1,
        observacao: 'Avulso: Novo Cliente Avulso'
      }));
    });
  });
});
