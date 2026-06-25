import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortalPrivateRoute } from '../PortalPrivateRoute';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockUsePortalAuth = vi.fn();
vi.mock('../../contexts/PortalAuthContext', () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

describe('PortalPrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve redirecionar para /:slug/login se não houver token no contexto nem no localStorage', () => {
    mockUsePortalAuth.mockReturnValue({ token: null });

    render(
      <MemoryRouter initialEntries={['/barbearia-souza/privado']}>
        <Routes>
          <Route path="/:slug/login" element={<div>Página de Login do Portal</div>} />
          <Route element={<PortalPrivateRoute />}>
            <Route path="/:slug/privado" element={<div>Conteúdo Privado do Portal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Página de Login do Portal')).toBeInTheDocument();
  });

  it('deve permitir acesso se houver token no contexto', () => {
    mockUsePortalAuth.mockReturnValue({ token: 'fake-portal-token' });

    render(
      <MemoryRouter initialEntries={['/barbearia-souza/privado']}>
        <Routes>
          <Route element={<PortalPrivateRoute />}>
            <Route path="/:slug/privado" element={<div>Conteúdo Privado do Portal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Conteúdo Privado do Portal')).toBeInTheDocument();
  });

  it('deve permitir acesso se houver token no localStorage, mesmo com token nulo no contexto', () => {
    mockUsePortalAuth.mockReturnValue({ token: null });
    localStorage.setItem('portal_token', 'stored-token');

    render(
      <MemoryRouter initialEntries={['/barbearia-souza/privado']}>
        <Routes>
          <Route element={<PortalPrivateRoute />}>
            <Route path="/:slug/privado" element={<div>Conteúdo Privado do Portal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Conteúdo Privado do Portal')).toBeInTheDocument();
  });
});
