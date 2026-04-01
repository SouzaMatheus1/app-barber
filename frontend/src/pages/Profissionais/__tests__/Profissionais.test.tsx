import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Profissionais } from '../Profissionais';

vi.mock('../../../services/ProfissionalService', () => ({
  profissionalService: { 
    listar: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
    editar: vi.fn(),
    deletar: vi.fn(),
  }
}));

describe('Página de Profissionais', () => {
  it('deve renderizar a tela de profissionais após o loading', async () => {
    render(<Profissionais />);
    
    await waitFor(() => {
      expect(screen.getByText('Profissionais')).toBeInTheDocument();
      expect(screen.getByText('Nenhum profissional cadastrado.')).toBeInTheDocument();
    });
  });
});
