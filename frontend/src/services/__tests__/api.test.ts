import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

describe('Instância Axios API (services/api.ts)', () => {
  const originalLocation = window.location;

  // Helper para simular diferentes URLs/caminhos
  const mockLocation = (url: string) => {
    const parsed = new URL(url);
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        href: parsed.href,
        assign: vi.fn(),
        replace: vi.fn(),
      }
    });
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation
    });
  });

  describe('Request Interceptor (Token Injection)', () => {
    const requestHandler = (api.interceptors.request as any).handlers[0].fulfilled;

    it('deve injetar token administrativo (token) se NÃO for portal', async () => {
      mockLocation('http://localhost:3000/dashboard');
      localStorage.setItem('token', 'admin-jwt-token');

      const config: any = { headers: new Map() };
      const result = await requestHandler(config);

      expect(result.headers.get('Authorization')).toBe('Bearer admin-jwt-token');
    });

    it('deve injetar portal_token se for portal (via subdomínio)', async () => {
      mockLocation('http://portal.localhost:3000/barbearia-premium');
      localStorage.setItem('portal_token', 'portal-jwt-token');

      const config: any = { headers: new Map() };
      const result = await requestHandler(config);

      expect(result.headers.get('Authorization')).toBe('Bearer portal-jwt-token');
    });

    it('deve injetar portal_token se for portal (via path legado /portal)', async () => {
      mockLocation('http://localhost:3000/portal/barbearia-do-ze');
      localStorage.setItem('portal_token', 'legacy-portal-token');

      const config: any = { headers: new Map() };
      const result = await requestHandler(config);

      expect(result.headers.get('Authorization')).toBe('Bearer legacy-portal-token');
    });

    it('não deve injetar Authorization se não houver token no localStorage', async () => {
      mockLocation('http://localhost:3000/dashboard');

      const config: any = { headers: new Map() };
      const result = await requestHandler(config);

      expect(result.headers.get('Authorization')).toBeUndefined();
    });
  });

  describe('Response Interceptor (401 Handling)', () => {
    const responseHandlerRejected = (api.interceptors.response as any).handlers[0].rejected;

    it('deve limpar chaves administrativas e redirecionar para /login se NÃO for portal', async () => {
      mockLocation('http://localhost:3000/dashboard');
      localStorage.setItem('token', 'admin-jwt-token');
      localStorage.setItem('user', JSON.stringify({ id: 1 }));

      const error = {
        response: { status: 401 }
      };

      await expect(responseHandlerRejected(error)).rejects.toEqual(error);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('deve limpar chaves do portal, extrair slug por pathname e redirecionar no subdomínio portal', async () => {
      mockLocation('http://portal.localhost:3000/salao-vip/agendar');
      localStorage.setItem('portal_token', 'portal-jwt-token');
      localStorage.setItem('portal_cliente', JSON.stringify({ id: 2 }));

      const error = {
        response: { status: 401 }
      };

      await expect(responseHandlerRejected(error)).rejects.toEqual(error);

      expect(localStorage.getItem('portal_token')).toBeNull();
      expect(localStorage.getItem('portal_cliente')).toBeNull();
      expect(window.location.href).toBe('/salao-vip/login');
    });

    it('deve limpar chaves do portal, extrair slug por regex e redirecionar no path legado /portal/:slug', async () => {
      mockLocation('http://localhost:3000/portal/salao-vip/agendar');
      localStorage.setItem('portal_token', 'portal-jwt-token');
      localStorage.setItem('portal_cliente', JSON.stringify({ id: 2 }));

      const error = {
        response: { status: 401 }
      };

      await expect(responseHandlerRejected(error)).rejects.toEqual(error);

      expect(localStorage.getItem('portal_token')).toBeNull();
      expect(localStorage.getItem('portal_cliente')).toBeNull();
      expect(window.location.href).toBe('/portal/salao-vip/login');
    });

    it('deve apenas propagar o erro se o status code não for 401', async () => {
      mockLocation('http://localhost:3000/dashboard');
      localStorage.setItem('token', 'admin-jwt-token');

      const error = {
        response: { status: 500 }
      };

      await expect(responseHandlerRejected(error)).rejects.toEqual(error);

      expect(localStorage.getItem('token')).toBe('admin-jwt-token');
    });
  });
});
