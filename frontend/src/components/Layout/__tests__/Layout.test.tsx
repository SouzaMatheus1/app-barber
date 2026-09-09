import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Layout from '../Layout';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../services/ChangelogService', () => ({
  changelogService: {
    contarNaoLidas: vi.fn().mockResolvedValue({ total: 0 }),
    listar: vi.fn().mockResolvedValue([]),
    marcarVisualizado: vi.fn().mockResolvedValue({}),
  },
}));

describe('Componente Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o layout com a sidebar e o conteúdo da rota filha', () => {
    mockUseAuth.mockReturnValue({
      user: { nomeFantasia: 'Barbearia do João' },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Página Principal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Deve mostrar o título no header mobile e na sidebar
    expect(screen.getByRole('heading', { name: 'Barbearia do João' })).toBeInTheDocument();
    expect(screen.getByText('Página Principal')).toBeInTheDocument();
  });

  it('deve abrir a sidebar ao clicar no botão de menu mobile', () => {
    mockUseAuth.mockReturnValue({
      user: { nomeFantasia: 'LambdaBarber' },
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Página Principal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // O elemento aside deve iniciar com '-translate-x-full' (fechada para mobile)
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('-translate-x-full');

    // Botão de menu no header mobile
    const toggleBtn = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(toggleBtn);

    // O aside deve ter a classe 'translate-x-0' correspondente a isOpen = true
    expect(aside?.className).toContain('translate-x-0');
  });
});
