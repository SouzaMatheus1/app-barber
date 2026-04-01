import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrivateRoute } from '../PrivateRoute';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock do hook useAuth
const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute', () => {
  it('deve redirecionar para /login se não houver token', () => {
    mockUseAuth.mockReturnValue({ token: null, isAdmin: false });

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route path="/login" element={<div>Página de Login</div>} />
          <Route element={<PrivateRoute />}>
            <Route path="/privado" element={<div>Conteúdo Privado</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('deve renderizar a rota se houver token', () => {
    mockUseAuth.mockReturnValue({ token: 'fake-token', isAdmin: false });

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/privado" element={<div>Conteúdo Privado</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Conteúdo Privado')).toBeInTheDocument();
  });

  it('deve redirecionar para /dashboard se a rota for adminOnly e o user não for admin', () => {
    mockUseAuth.mockReturnValue({ token: 'fake-token', isAdmin: false });

    render(
      <MemoryRouter initialEntries={['/admin-area']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route element={<PrivateRoute adminOnly={true} />}>
            <Route path="/admin-area" element={<div>Área Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('deve renderizar se a rota for adminOnly e o user for admin', () => {
    mockUseAuth.mockReturnValue({ token: 'fake-token', isAdmin: true });

    render(
      <MemoryRouter initialEntries={['/admin-area']}>
        <Routes>
          <Route element={<PrivateRoute adminOnly={true} />}>
            <Route path="/admin-area" element={<div>Área Admin</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Área Admin')).toBeInTheDocument();
  });
});
