import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Clientes } from '../Clientes';

vi.mock('../../../services/ClienteService', () => {
  return {
    ClienteService: class {
      listar = vi.fn().mockResolvedValue([]);
      criar = vi.fn();
      editar = vi.fn();
      deletar = vi.fn();
    }
  };
});

describe('Página de Clientes', () => {
  it('deve renderizar a tela de clientes após o loading', async () => {
    render(<Clientes />);
    
    await waitFor(() => {
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Nenhum cliente encontrado.')).toBeInTheDocument();
    });
  });
});
