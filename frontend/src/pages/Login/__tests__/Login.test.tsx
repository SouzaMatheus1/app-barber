import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import { authService } from '../../../services/authService';

// Mock dependências do React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock do Contexto de Auth
const mockLogin = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// Mock do Serviço de Auth (API)
vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('Página de Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a tela de login corretamente', () => {
    render(<Login />);
    expect(screen.getByText(/WS Barber Shop/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/exemplo@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar na Plataforma/i })).toBeInTheDocument();
  });

  it('deve mostrar erro quando o serviço falhar', async () => {
    // @ts-ignore
    (authService.login as jest.Mock).mockRejectedValueOnce(new Error('Credenciais inválidas'));

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText(/exemplo@email.com/i), { target: { value: 'teste@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

    await waitFor(() => {
      expect(screen.getByText(/Credenciais inválidas\. Tente novamente\./i)).toBeInTheDocument();
    });
  });

  it('deve logar e redirecionar para o dashboard com sucesso', async () => {
    // @ts-ignore
    (authService.login as jest.Mock).mockResolvedValueOnce({
      token: 'fake-jwt-token',
      profissional: { id: 1, nome: 'Teste' }
    });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/exemplo@email.com/i), { target: { value: 'admin@barbearia.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Plataforma/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin@barbearia.com', 'admin123');
      expect(mockLogin).toHaveBeenCalledWith('fake-jwt-token', { id: 1, nome: 'Teste' });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
