import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Assinaturas from '../Assinaturas';
import { assinaturaService } from '../../../services/AssinaturaService';
import { itemCatalogoService } from '../../../services/ItemCatalogoService';
import { transacaoService } from '../../../services/TransacaoService';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/AssinaturaService', () => ({
  assinaturaService: {
    getPlanos: vi.fn(),
    getAssinaturas: vi.fn(),
    createPlano: vi.fn(),
    editPlano: vi.fn(),
    deletePlano: vi.fn(),
    renovar: vi.fn()
  }
}));

vi.mock('../../../services/ItemCatalogoService', () => ({
  itemCatalogoService: {
    listar: vi.fn()
  }
}));

vi.mock('../../../services/TransacaoService', () => ({
  transacaoService: {
    listar: vi.fn()
  }
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nome: 'Admin' }
  })
}));

describe('Página Assinaturas', () => {
  const mockPlanos = [
    {
      id: 1,
      nome: 'Plano Ouro',
      valorMensal: 150.00,
      frequencia: 'MENSAL',
      itens: [
        { id: 1, item: { nome: 'Corte de Cabelo' }, quantidade: 4 }
      ]
    }
  ];

  const mockAssinaturas = [
    {
      id: 1,
      clienteId: 10,
      cliente: { nome: 'Maria Assinante', telefone: '999999999' },
      plano: { id: 1, nome: 'Plano Ouro', frequencia: 'MENSAL', valorMensal: 150.00 },
      status: 'ATIVA',
      dataProximoVencimento: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 dias
      creditos: [
        { id: 1, item: { nome: 'Corte de Cabelo' }, quantidadeRestante: 2 }
      ]
    }
  ];

  const mockCatalogo = [
    { id: 2, nome: 'Corte de Cabelo', tipo: { descricao: 'SERVICO' } },
    { id: 3, nome: 'Lavagem', tipo: { descricao: 'SERVICO' } }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (assinaturaService.getPlanos as any).mockResolvedValue(mockPlanos);
    (assinaturaService.getAssinaturas as any).mockResolvedValue(mockAssinaturas);
    (itemCatalogoService.listar as any).mockResolvedValue(mockCatalogo);
    (transacaoService.listar as any).mockResolvedValue([]);
  });

  it('deve renderizar a página, listar planos e abas corretamente', async () => {
    render(
      <MemoryRouter>
        <Assinaturas />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Clube de Assinaturas/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Plano Ouro')).toBeInTheDocument();
      expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
      expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument();
    });
  });

  it('deve mudar de aba e listar assinantes', async () => {
    render(
      <MemoryRouter>
        <Assinaturas />
      </MemoryRouter>
    );

    const tabAssinantes = screen.getByRole('button', { name: /Assinantes/i });
    fireEvent.click(tabAssinantes);

    await waitFor(() => {
      expect(screen.getByText('Maria Assinante')).toBeInTheDocument();
      expect(screen.getByText('ATIVA')).toBeInTheDocument();
    });
  });

  it('deve permitir abrir formulário de novo plano e salvá-lo', async () => {
    (assinaturaService.createPlano as any).mockResolvedValueOnce({ id: 2 });
    render(
      <MemoryRouter>
        <Assinaturas />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Plano Ouro')).toBeInTheDocument();
    });

    const btnNovo = screen.getByRole('button', { name: /Novo Plano/i });
    fireEvent.click(btnNovo);

    // Campos do form
    const inputNome = screen.getByPlaceholderText(/Ex: Plano Prata/i);
    fireEvent.change(inputNome, { target: { value: 'Plano Bronze' } });

    const inputValor = screen.getByPlaceholderText(/79.90/i);
    fireEvent.change(inputValor, { target: { value: '50.00' } });

    const selectFrequencia = screen.getByRole('combobox');
    fireEvent.change(selectFrequencia, { target: { value: 'MENSAL' } });

    const btnSalvar = screen.getByRole('button', { name: /^Ativar Plano$/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(assinaturaService.createPlano).toHaveBeenCalledWith(expect.objectContaining({
        nome: 'Plano Bronze',
        valorMensal: 50
      }));
    });
  });
});
