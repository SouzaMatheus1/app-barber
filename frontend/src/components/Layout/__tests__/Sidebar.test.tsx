import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../Sidebar';
import { MemoryRouter } from 'react-router-dom';

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Componente Sidebar', () => {
  const setIsOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { href: '' });
  });

  it('deve renderizar os links de navegação e o nome da barbearia', () => {
    mockUseAuth.mockReturnValue({
      user: { nomeFantasia: 'LambdaBarber' },
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} setIsOpen={setIsOpen} />
      </MemoryRouter>
    );

    expect(screen.getByText('LambdaBarber')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Transações')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Profissionais')).toBeInTheDocument();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Comissões')).toBeInTheDocument();
    expect(screen.getByText('Assinaturas')).toBeInTheDocument();
    expect(screen.getByText('Custos')).toBeInTheDocument();
  });

  it('deve chamar setIsOpen(false) ao clicar em um link', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} setIsOpen={setIsOpen} />
      </MemoryRouter>
    );

    const linkDashboard = screen.getByText('Dashboard');
    fireEvent.click(linkDashboard);

    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it('deve realizar logout ao clicar no botão Sair', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });

    localStorage.setItem('token', 'some-token');

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} setIsOpen={setIsOpen} />
      </MemoryRouter>
    );

    const btnSair = screen.getByText('Sair');
    fireEvent.click(btnSair);

    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.href).toBe('/');
  });
});
