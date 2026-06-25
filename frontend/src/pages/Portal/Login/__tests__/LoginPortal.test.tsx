import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPortal from '../LoginPortal';
import { api } from '../../../../services/api';
import { MemoryRouter } from 'react-router-dom';

const mockLogin = vi.fn();
vi.mock('../../../../contexts/PortalAuthContext', () => ({
  usePortalAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../../../../services/api', () => ({
  api: {
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

describe('LoginPortal Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o passo inicial de telefone e fazer a verificação com sucesso', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { status: 'EXISTS_WITH_PASSWORD' }
    });

    render(
      <MemoryRouter>
        <LoginPortal />
      </MemoryRouter>
    );

    expect(screen.getByText('Número do Celular')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    
    // Digita telefone válido
    fireEvent.change(phoneInput, { target: { value: '11988888888' } });
    
    const continueBtn = screen.getByRole('button', { name: 'Continuar' });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/portal/barbearia-souza/auth/check-phone', { telefone: '11988888888' });
      expect(screen.getByText('Sua Senha')).toBeInTheDocument();
    });
  });

  it('deve lidar com cliente sem senha e ir para cadastro preenchendo o nome', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { status: 'EXISTS_WITHOUT_PASSWORD', nome: 'Matheus Souza' }
    });

    render(
      <MemoryRouter>
        <LoginPortal />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    fireEvent.change(phoneInput, { target: { value: '11988888888' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Criar uma Senha Segura')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nome Completo')).toHaveValue('Matheus Souza');
    });
  });

  it('deve permitir fazer login com sucesso no passo PASSWORD', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { status: 'EXISTS_WITH_PASSWORD' }
    });

    render(
      <MemoryRouter>
        <LoginPortal />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    fireEvent.change(phoneInput, { target: { value: '11988888888' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(screen.getByText('Sua Senha')).toBeInTheDocument();
    });

    (api.post as any).mockResolvedValueOnce({
      data: { token: 'portal-token-123', cliente: { id: 5, nome: 'João Cliente' } }
    });

    const passInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passInput, { target: { value: 'minhasenha123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Entrar no Portal' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenLastCalledWith('/portal/barbearia-souza/auth/login', {
        telefone: '11988888888',
        senha: 'minhasenha123'
      });
      expect(mockLogin).toHaveBeenCalledWith('portal-token-123', { id: 5, nome: 'João Cliente' });
      expect(mockNavigate).toHaveBeenCalledWith('/barbearia-souza/home');
    });
  });

  it('deve permitir cadastrar com sucesso no passo REGISTER', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { status: 'NEW_CLIENT' }
    });

    render(
      <MemoryRouter>
        <LoginPortal />
      </MemoryRouter>
    );

    const phoneInput = screen.getByPlaceholderText('(11) 99999-9999');
    fireEvent.change(phoneInput, { target: { value: '11988888888' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nome Completo')).toBeInTheDocument();
    });

    (api.post as any).mockResolvedValueOnce({
      data: { token: 'portal-token-new', cliente: { id: 6, nome: 'Novo Cliente' } }
    });

    fireEvent.change(screen.getByPlaceholderText('Nome Completo'), { target: { value: 'Novo Cliente' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail (Opcional)'), { target: { value: 'cliente@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText('Criar uma Senha Segura'), { target: { value: 'nova1234' } });

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar Cadastro' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenLastCalledWith('/portal/barbearia-souza/auth/register', {
        telefone: '11988888888',
        senha: 'nova1234',
        nome: 'Novo Cliente',
        email: 'cliente@gmail.com'
      });
      expect(mockLogin).toHaveBeenCalledWith('portal-token-new', { id: 6, nome: 'Novo Cliente' });
      expect(mockNavigate).toHaveBeenCalledWith('/barbearia-souza/home');
    });
  });
});
