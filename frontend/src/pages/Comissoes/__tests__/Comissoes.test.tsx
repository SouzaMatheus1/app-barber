import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Comissoes } from '../Comissoes';

vi.mock('../../../services/ProfissionalService', () => ({
  profissionalService: { listar: vi.fn().mockResolvedValue([]) }
}));
vi.mock('../../../services/ComissaoService', () => ({
  comissaoService: { relatorio: vi.fn() }
}));

describe('Página de Comissões', () => {
  it('deve renderizar os filtros do relatório de comissões na interface inicial', async () => {
    render(<Comissoes />);
    
    await waitFor(() => {
      expect(screen.getByText('Relatório de Comissões')).toBeInTheDocument();
      expect(screen.getByText('Filtros de Período')).toBeInTheDocument();
    });
  });
});
