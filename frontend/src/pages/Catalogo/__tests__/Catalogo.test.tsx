import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Catalogo } from '../Catalogo';

vi.mock('../../../services/ItemCatalogoService', () => ({
  itemCatalogoService: { 
    listar: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
    editar: vi.fn(),
    deletar: vi.fn(),
  }
}));

describe('Página de Catálogo', () => {
  it('deve renderizar a tela de catálogo após o loading', async () => {
    render(<Catalogo />);
    
    await waitFor(() => {
      expect(screen.getByText('Catálogo')).toBeInTheDocument();
      expect(screen.getByText('Nenhum item cadastrado no catálogo.')).toBeInTheDocument();
    });
  });
});
