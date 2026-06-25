import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortalHome from '../PortalHome';
import { api } from '../../../../services/api';
import { MemoryRouter } from 'react-router-dom';

const mockLogout = vi.fn();
vi.mock('../../../../contexts/PortalAuthContext', () => ({
  usePortalAuth: () => ({
    cliente: { id: 10, nome: 'Thiago Cliente', telefone: '11988888888' },
    logout: mockLogout,
  }),
}));

vi.mock('../../../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
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

describe('PortalHome Page', () => {
  const mockEmpresa = { id: 1, nomeFantasia: 'Souza Barbearia', slug: 'barbearia-souza' };
  
  const mockAgendamentos = [
    {
      id: 20,
      dataHoraInicio: new Date(new Date().getTime() + 86400000).toISOString(),
      dataHoraFim: new Date(new Date().getTime() + 86400000 + 1800000).toISOString(),
      status: 'CONFIRMADO',
      profissional: { nome: 'João Barbeiro' },
      servicos: [{ item: { id: 1, nome: 'Corte Social', preco: 40.00 } }]
    },
    {
      id: 21,
      dataHoraInicio: new Date(new Date().getTime() - 86400000).toISOString(),
      dataHoraFim: new Date(new Date().getTime() - 86400000 + 1800000).toISOString(),
      status: 'CONCLUIDO',
      profissional: { nome: 'João Barbeiro' },
      servicos: [{ item: { id: 1, nome: 'Barba', preco: 30.00 } }]
    }
  ];

  const mockAssinatura = {
    id: 1,
    plano: {
      nome: 'Plano Gold',
      itens: [{ itemId: 1, quantidade: 4 }]
    },
    dataProximoVencimento: '2026-07-19T00:00:00.000Z',
    creditos: [
      {
        id: 1,
        itemId: 1,
        quantidadeRestante: 3,
        item: { nome: 'Corte Social' }
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('alert', vi.fn());
  });

  it('deve carregar dados e renderizar a página corretamente', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/portal/barbearia-souza/empresa') return Promise.resolve({ data: mockEmpresa });
      if (url === '/agendamentos') return Promise.resolve({ data: mockAgendamentos });
      if (url === '/portal/minha-assinatura') return Promise.resolve({ data: mockAssinatura });
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter>
        <PortalHome />
      </MemoryRouter>
    );

    expect(screen.getByText('Buscando seus horários...')).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText('Buscando seus horários...'), { timeout: 3000 });

    expect(screen.getByText('Souza Barbearia')).toBeInTheDocument();
    expect(screen.getByText('Thiago')).toBeInTheDocument();
    expect(screen.getAllByText('Corte Social').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Barba')).toBeInTheDocument();
    expect(screen.getByText('Plano Gold')).toBeInTheDocument();
    expect(screen.getByText('3 de 4 restantes')).toBeInTheDocument();
  });

  it('deve permitir cancelar um agendamento com confirmação do usuário', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/portal/barbearia-souza/empresa') return Promise.resolve({ data: mockEmpresa });
      if (url === '/agendamentos') return Promise.resolve({ data: mockAgendamentos });
      if (url === '/portal/minha-assinatura') return Promise.resolve({ data: null });
      return Promise.resolve({ data: null });
    });

    (api.put as any).mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <PortalHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Souza Barbearia')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: 'Desistir / Cancelar' });
    fireEvent.click(cancelBtn);

    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja cancelar este agendamento?');
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/agendamentos/20/status', { status: 'CANCELADO' });
      expect(window.alert).toHaveBeenCalledWith('Agendamento cancelado com sucesso.');
    });
  });

  it('deve realizar logout ao clicar no botão de logout no header', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/portal/barbearia-souza/empresa') return Promise.resolve({ data: mockEmpresa });
      if (url === '/agendamentos') return Promise.resolve({ data: [] });
      if (url === '/portal/minha-assinatura') return Promise.resolve({ data: null });
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter>
        <PortalHome />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Souza Barbearia')).toBeInTheDocument();
    });

    const logoutBtn = screen.getByTitle('Sair do Portal');
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/barbearia-souza/login');
  });
});
