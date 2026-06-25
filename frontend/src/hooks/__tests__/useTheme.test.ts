import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from '../useTheme';

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseLocation = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

describe('useTheme hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar tema nulo e loadingTheme falso devido à desativação temporária no código', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseLocation.mockReturnValue({ pathname: '/' });

    const { result } = renderHook(() => useTheme());

    expect(result.current.tema).toBeNull();
    expect(result.current.loadingTheme).toBe(false);
  });
});
