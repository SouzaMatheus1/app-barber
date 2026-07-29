import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from '../useTheme';
import { api } from '../../services/api';

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseLocation = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('useTheme hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-secondary');
    document.documentElement.style.removeProperty('--color-background');
    document.documentElement.style.removeProperty('--color-surface');
    document.documentElement.style.removeProperty('--color-text');
  });

  it('deve retornar tema nulo e loadingTheme falso se nenhum slug for resolvido', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseLocation.mockReturnValue({ pathname: '/' });

    const { result } = renderHook(() => useTheme());

    expect(result.current.tema).toBeNull();
    expect(result.current.loadingTheme).toBe(false);
  });

  it('deve buscar o tema da API e aplicar propriedades CSS ao documentElement quando slug for fornecido', async () => {
    mockUseAuth.mockReturnValue({ user: { slug: 'barbearia' } });
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });

    const mockTheme = {
      corPrimaria: '#C9A84C',
      corSecundaria: '#E2C175',
      corFundo: '#0A0A0A',
      corSuperficie: '#111111',
      corTexto: '#F5F5F5',
      logoUrl: '/images/logo.png',
      faviconUrl: '/images/favicon.ico',
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTheme });

    const { result } = renderHook(() => useTheme());

    await waitFor(() => {
      expect(result.current.loadingTheme).toBe(false);
    });

    expect(api.get).toHaveBeenCalledWith('/temas/empresa/barbearia');
    expect(result.current.tema).toEqual(mockTheme);
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#C9A84C');
    expect(document.documentElement.style.getPropertyValue('--color-secondary')).toBe('#E2C175');
    expect(document.documentElement.style.getPropertyValue('--color-background')).toBe('#0A0A0A');
    expect(document.documentElement.style.getPropertyValue('--color-surface')).toBe('#111111');
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('#F5F5F5');
  });
});
