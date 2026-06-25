import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { PortalAuthProvider, usePortalAuth } from '../PortalAuthContext';

function TestPortalComponent() {
  const { cliente, token, login, logout } = usePortalAuth();
  return (
    <div>
      <div data-testid="cliente">{cliente ? cliente.nome : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <button onClick={() => login('portal-token-mock', { id: 10, nome: 'Thiago Cliente', telefone: '11988888888' })}>Login Cliente</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('PortalAuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve inicializar com valores nulos e carregar do localStorage se existirem', () => {
    localStorage.setItem('portal_token', 'saved-portal-token');
    localStorage.setItem('portal_cliente', JSON.stringify({ id: 10, nome: 'Thiago Saved', telefone: '11988888888' }));

    render(
      <PortalAuthProvider>
        <TestPortalComponent />
      </PortalAuthProvider>
    );

    expect(screen.getByTestId('cliente').textContent).toBe('Thiago Saved');
    expect(screen.getByTestId('token').textContent).toBe('saved-portal-token');
  });

  it('deve permitir fazer login e atualizar o localStorage e estado', () => {
    render(
      <PortalAuthProvider>
        <TestPortalComponent />
      </PortalAuthProvider>
    );

    expect(screen.getByTestId('cliente').textContent).toBe('null');

    act(() => {
      screen.getByText('Login Cliente').click();
    });

    expect(screen.getByTestId('cliente').textContent).toBe('Thiago Cliente');
    expect(screen.getByTestId('token').textContent).toBe('portal-token-mock');
    expect(localStorage.getItem('portal_token')).toBe('portal-token-mock');
    expect(localStorage.getItem('portal_cliente')).toContain('Thiago Cliente');
  });

  it('deve permitir fazer logout e limpar o localStorage e estado', () => {
    localStorage.setItem('portal_token', 'saved-portal-token');
    localStorage.setItem('portal_cliente', JSON.stringify({ id: 10, nome: 'Thiago Saved', telefone: '11988888888' }));

    render(
      <PortalAuthProvider>
        <TestPortalComponent />
      </PortalAuthProvider>
    );

    expect(screen.getByTestId('cliente').textContent).toBe('Thiago Saved');

    act(() => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('cliente').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorage.getItem('portal_token')).toBeNull();
    expect(localStorage.getItem('portal_cliente')).toBeNull();
  });
});
