import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Transacoes from '../Transacoes';
import { transacaoService } from '../../../services/TransacaoService';
import { assinaturaService } from '../../../services/AssinaturaService';
import userEvent from '@testing-library/user-event';

// Mock do assinaturaService
vi.mock('../../../services/AssinaturaService', () => ({
  assinaturaService: {
    getAssinaturaAtiva: vi.fn()
  }
}));

// Mock do transacaoService
vi.mock('../../../services/TransacaoService', () => ({
  transacaoService: {
    getCatalogo: vi.fn(),
    getProfissionais: vi.fn(),
    getClientes: vi.fn(),
    create: vi.fn()
  }
}));

describe('Página de Transações', () => {
  const mockCatalogo = [
    { id: 1, nome: 'Corte', preco: '35.00' },
    { id: 2, nome: 'Pomada', preco: '25.00' }
  ];
  const mockProfissionais = [{ id: 1, nome: 'Admin Batista' }];
  const mockClientes = [{ id: 1, nome: 'João Silva' }];

  beforeEach(() => {
    vi.clearAllMocks();
    (transacaoService.getCatalogo as any).mockResolvedValue(mockCatalogo);
    (transacaoService.getProfissionais as any).mockResolvedValue(mockProfissionais);
    (transacaoService.getClientes as any).mockResolvedValue(mockClientes);
    (assinaturaService.getAssinaturaAtiva as any).mockResolvedValue(null);
  });

  it('deve carregar e renderizar os dados do banco nos selects corretamente', async () => {
    render(<Transacoes />);
    
    expect(screen.getByText('Nova Transação')).toBeInTheDocument();

    await waitFor(() => {
      // Select de profissional deve ter Admin Batista
      expect(screen.getByRole('option', { name: 'Admin Batista' })).toBeInTheDocument();
      // Select de catálogo deve ter as opções Corte e Pomada
      expect(screen.getByRole('option', { name: 'Corte' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pomada' })).toBeInTheDocument();
    });
  });

  it('deve permitir adicionar múltiplos itens e calcular o total', async () => {
    render(<Transacoes />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Corte' })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const selects = screen.getAllByRole('combobox');
    const selectProfissional = selects[0]; // O primeiro select é o profissional
    const selectItemInicial = selects[1]; // O segundo é o primeiro item do catalogo
    
    // Seleciona profissional
    await user.selectOptions(selectProfissional, '1');
    
    // Seleciona "Corte"
    await user.selectOptions(selectItemInicial, 'Corte');

    // Ao selecionar "Corte", o preço unitário já deve ser atualizado para 35 (via onChange)
    // O valor do total formatado como BRL
    await waitFor(() => {
      expect(screen.getByText(/R\$\s?35,00/i)).toBeInTheDocument();
    });

    // Clica em "Adicionar Item"
    const btnAdd = screen.getByRole('button', { name: /Adicionar Item/i });
    await user.click(btnAdd);

    // Agora devem haver 3 selects (Profissional, Item 1, Item 2)
    const newSelects = screen.getAllByRole('combobox');
    expect(newSelects.length).toBe(3);
    
    const selectSegundoItem = newSelects[2];

    // Seleciona "Pomada"
    await user.selectOptions(selectSegundoItem, 'Pomada');

    // Muda a quantidade do segundo item para 2
    // input de qtd é o primeiro number type input (ou podemos pegar pelo role generalizado - spinbutton)
    const inputsQtd = screen.getAllByRole('spinbutton'); 
    // Inputs de spinbutton: 
    // Item 1: qtd, preco
    // Item 2: qtd, preco
    // Index 0 = qtd Item 1, Index 1 = preco Item 1, Index 2 = qtd Item 2, Index 3 = preco Item 2
    
    fireEvent.change(inputsQtd[2], { target: { value: '2' } });

    // 1 Corte (35) + 2 Pomadas (2x25=50) => Total = 85.00
    await waitFor(() => {
      expect(screen.getByText(/R\$\s?85,00/i)).toBeInTheDocument();
    });
  });

  it('deve enviar a form submissão com os dados corretos e exibir sucesso', async () => {
    (transacaoService.create as any).mockResolvedValueOnce({ success: true });
    render(<Transacoes />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Corte' })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const selects = screen.getAllByRole('combobox');
    const selectProf = selects[0];
    const selectItem = selects[1];

    // Set client
    const inputCliente = screen.getByPlaceholderText(/Ex: João Silva ou Avulso/i);
    await user.type(inputCliente, 'João Silva');

    await user.selectOptions(selectProf, '1'); // Admin
    await user.selectOptions(selectItem, 'Corte');

    // Muta quantidade
    const inputsQtd = screen.getAllByRole('spinbutton'); 
    fireEvent.change(inputsQtd[0], { target: { value: '1' } }); // Qtd = 1

    const btnSubmit = screen.getByRole('button', { name: /Finalizar Transação/i });
    await user.click(btnSubmit);

    await waitFor(() => {
      expect(transacaoService.create).toHaveBeenCalledWith({
        descricao: 'Atendimento para: João Silva',
        tipoTransacaoId: 1,
        profissionalId: 1,
        clienteId: 1, // Por ter escrito João Silva e ele existir no mockClientes
        itens: [{ itemId: 1, quantidade: 1, usouCreditoAssinatura: false }]
      });
    });

    // Mostra "Transação Registrada!"
    await waitFor(() => {
      expect(screen.getByText('Transação Registrada!')).toBeInTheDocument();
    });
  });
});
