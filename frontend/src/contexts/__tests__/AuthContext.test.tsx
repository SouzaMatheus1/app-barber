import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

function TestComponent() {
  const { user, token, login, logout, isAdmin } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.nome : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="admin">{isAdmin ? 'true' : 'false'}</div>
      <div data-testid="empresa">{user?.nomeFantasia || 'null'}</div>
      <button onClick={() => login('mock-token', { id: 1, nome: 'Matheus', perfil: 'ADMIN', nomeFantasia: 'Barbearia Souza' })}>Login Admin</button>
      <button onClick={() => login('mock-token-2', { id: 2, nome: 'João', perfil: 'PROFISSIONAL', nomeFantasia: '' })}>Login Profissional</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.title = 'λ MAT';
  });

  it('deve inicializar com valores nulos e carregar do localStorage se existirem', () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, nome: 'Matheus Saved', perfil: 'ADMIN' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('Matheus Saved');
    expect(screen.getByTestId('token').textContent).toBe('saved-token');
    expect(screen.getByTestId('admin').textContent).toBe('true');
  });

  it('deve permitir fazer login e atualizar o localStorage, estado e o título da página', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');

    // Clica no botão Login Admin
    act(() => {
      screen.getByText('Login Admin').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('Matheus');
    expect(screen.getByTestId('token').textContent).toBe('mock-token');
    expect(screen.getByTestId('admin').textContent).toBe('true');
    expect(localStorage.getItem('token')).toBe('mock-token');
    expect(document.title).toBe('Barbearia Souza | λ MAT');

    // Clica no botão Login Profissional
    act(() => {
      screen.getByText('Login Profissional').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('João');
    expect(screen.getByTestId('admin').textContent).toBe('false');
    expect(document.title).toBe('λ MAT');
  });

  it('deve permitir fazer logout e limpar o localStorage e estado', () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, nome: 'Matheus Saved', perfil: 'ADMIN' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('Matheus Saved');

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
