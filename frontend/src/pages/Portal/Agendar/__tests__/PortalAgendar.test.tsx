import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortalAgendar from '../PortalAgendar';
import { api } from '../../../../services/api';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'barbearia-souza' }),
  };
});

describe('PortalAgendar Page', () => {
  const mockServicos = [
    { id: 1, nome: 'Corte Social', preco: 40.00, duracaoMinutos: 30, tipo: { descricao: 'SERVICO' } },
    { id: 2, nome: 'Barba', preco: 30.00, duracaoMinutos: 20, tipo: { descricao: 'SERVICO' } },
    { id: 3, nome: 'Shampoo', preco: 15.00, duracaoMinutos: 10, tipo: { descricao: 'PRODUTO' } }
  ];

  const mockProfissionais = [
    { id: 5, nome: 'João Barbeiro' },
    { id: 6, nome: 'Pedro Barbeiro' }
  ];

  const mockSlots = ['09:00', '09:30', '10:00'];

  const mockAssinatura = {
    id: 1,
    plano: { nome: 'Plano Gold' },
    creditos: [
      { id: 1, itemId: 1, quantidadeRestante: 5, item: { nome: 'Corte Social' } }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve realizar o fluxo completo de agendamento com sucesso', async () => {
    (api.get as any).mockImplementation((url: string, config: any) => {
      if (url === '/itens') return Promise.resolve({ data: mockServicos });
      if (url === '/profissionais') return Promise.resolve({ data: mockProfissionais });
      if (url === '/portal/minha-assinatura') return Promise.resolve({ data: mockAssinatura });
      if (url === '/agendamentos/disponibilidade') {
        expect(config.params.profissionalId).toBe(5);
        expect(config.params.duracaoMinutos).toBe(30);
        return Promise.resolve({ data: mockSlots });
      }
      return Promise.resolve({ data: [] });
    });

    (api.post as any).mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <PortalAgendar />
      </MemoryRouter>
    );

    expect(screen.getByText('O que vamos fazer hoje?')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Corte Social')).toBeInTheDocument();
      expect(screen.getByText('Barba')).toBeInTheDocument();
      expect(screen.queryByText('Shampoo')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Corte Social'));

    const btnNext1 = await screen.findByRole('button', { name: /Próximo/i });
    fireEvent.click(btnNext1);

    await waitFor(() => {
      expect(screen.getByText('Com quem deseja agendar?')).toBeInTheDocument();
      expect(screen.getByText('João Barbeiro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('João Barbeiro'));

    const btnNext2 = await screen.findByRole('button', { name: /Barbeiro: João Barbeiro/i });
    fireEvent.click(btnNext2);

    await waitFor(() => {
      expect(screen.getByText('Quando quer ser atendido?')).toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('09:00'));

    const btnNext3 = await screen.findByRole('button', { name: /Revisar/i });
    fireEvent.click(btnNext3);

    await waitFor(() => {
      expect(screen.getByText('Tudo pronto!')).toBeInTheDocument();
      expect(screen.getByText('Total Estimado')).toBeInTheDocument();
    });

    expect(screen.getByText('Pago com Créditos')).toBeInTheDocument();

    const btnConfirm = screen.getByRole('button', { name: /Confirmar Agendamento/i });
    fireEvent.click(btnConfirm);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/agendamentos', expect.objectContaining({
        profissionalId: 5,
        servicosIds: [1],
        usarCreditos: true
      }));
      expect(screen.getByText('Agendado!')).toBeInTheDocument();
    });

    const btnHome = screen.getByRole('button', { name: 'Voltar para a Home' });
    fireEvent.click(btnHome);
    expect(mockNavigate).toHaveBeenCalledWith('/barbearia-souza/home');
  });
});
