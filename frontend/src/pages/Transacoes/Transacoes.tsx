import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { transacaoService } from '../../services/TransacaoService';
import { assinaturaService } from '../../services/AssinaturaService';
import { ClienteService } from '../../services/ClienteService';

const clienteService = new ClienteService();

interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  usouCreditoAssinatura?: boolean;
}

const Transacoes: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [professional, setProfessional] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [catalog, setCatalog] = useState<{id: number, name: string, price: number}[]>([]);
  const [profissionais, setProfissionais] = useState<{id: number, nome: string}[]>([]);
  const [clientes, setClientes] = useState<{id: number, nome: string}[]>([]);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<any>(null);

  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catData, profData] = await Promise.all([
          transacaoService.getCatalogo(),
          transacaoService.getProfissionais()
        ]);
        setCatalog(catData.map((c: any) => ({ id: c.id, name: c.nome, price: Number(c.preco) })));
        setProfissionais(profData);
      } catch (err) {
        console.error("Erro ao carregar dados base:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const checkAssinatura = async () => {
      const foundClient = clientes.find(c => c.nome.toLowerCase() === clientName.toLowerCase()) || 
                          clientSuggestions.find(c => c.nome.toLowerCase() === clientName.toLowerCase());
      if (foundClient) {
        try {
           const ativa = await assinaturaService.getAssinaturaAtiva(foundClient.id);
           setAssinaturaAtiva(ativa || null);
        } catch(e) {
           setAssinaturaAtiva(null);
        }
      } else {
        setAssinaturaAtiva(null);
      }
    };
    if (clientName) {
      checkAssinatura();
    } else {
      setAssinaturaAtiva(null);
    }
  }, [clientName]);

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientName(value);
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 2) {
      setIsSearchingClient(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await clienteService.search(value);
          setClientSuggestions(results);
          setClientes(prev => {
             const newC = [...prev];
             results.forEach((r:any) => {
                if(!newC.find(c => c.id === r.id)) newC.push(r);
             });
             return newC;
          });
        } catch (error) {
          console.error("Erro na busca", error);
        } finally {
          setIsSearchingClient(false);
        }
      }, 400);
    } else {
      setClientSuggestions([]);
      setIsSearchingClient(false);
    }
  };

  const selectClient = (cliente: any) => {
    setClientName(cliente.nome);
    setShowSuggestions(false);
    setClientSuggestions([]);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof TransactionItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Preenchimento automatico do preço se o nome for de um serviço conhecido
        if (field === 'name') {
          const found = catalog.find(c => c.name === value);
          if (found) {
            updatedItem.price = found.price;
            (updatedItem as any).itemId = found.id;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => {
        if (item.usouCreditoAssinatura) return acc;
        return acc + (item.quantity * item.price);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const foundClient = clientes.find(c => c.nome.toLowerCase() === clientName.toLowerCase());
      
      const payload = {
        descricao: `Atendimento para: ${clientName}`,
        tipoTransacaoId: 1, // 1 = ENTRADA na seed
        profissionalId: Number(professional),
        clienteId: foundClient ? foundClient.id : null,
        itens: items.filter(i => (i as any).itemId).map(i => ({
          itemId: (i as any).itemId,
          quantidade: i.quantity,
          usouCreditoAssinatura: i.usouCreditoAssinatura || false
        }))
      };
      
      if (payload.itens.length === 0) {
        alert("Selecione itens válidos do catálogo.");
        setLoading(false);
        return;
      }

      await transacaoService.create(payload);
      // console.log('Transação registrada:', payload);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // fake delay
      setSuccess(true);
      
      // Reset apos sucesso
      setTimeout(() => {
        setSuccess(false);
        setClientName('');
        setProfessional('');
        setItems([{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao registrar transação', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Nova Transação</h1>
        <p className="text-[#E5E5E5]/60 mt-1">Registre um novo atendimento ou venda.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 shadow-lg p-6 md:p-8 space-y-8 relative overflow-hidden">
        
        {/* Overlay de Sucesso */}
        {success && (
          <div className="absolute inset-0 bg-[#121212]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={64} className="text-[#D4AF37] mb-4" />
            <h2 className="text-2xl font-bold text-[#E5E5E5]">Transação Registrada!</h2>
            <p className="text-[#D4AF37] mt-2 text-lg">Sucesso na operação.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 z-10 relative">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Nome do Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={clientName}
                onChange={handleClientNameChange}
                onFocus={() => { if (clientSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 placeholder-[#E5E5E5]/30"
                placeholder="Ex: João Silva ou Avulso"
                autoComplete="off"
              />
              {isSearchingClient && (
                <div className="absolute right-3 top-3 text-[#D4AF37]">
                   <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              {showSuggestions && clientSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {clientSuggestions.map((cliente) => (
                    <li 
                      key={cliente.id}
                      onClick={() => selectClient(cliente)}
                      className="px-4 py-3 cursor-pointer hover:bg-[#D4AF37]/10 text-[#E5E5E5] border-b border-[#D4AF37]/10 last:border-0 transition-colors"
                    >
                      <div className="font-bold">{cliente.nome}</div>
                      <div className="text-xs text-[#E5E5E5]/60">{cliente.telefone || 'Sem telefone'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {assinaturaAtiva && (
               <div className="mt-2 text-xs font-bold text-[#121212] bg-[#D4AF37] inline-block px-3 py-1.5 rounded shadow-lg animate-in fade-in">
                 💎 Assinante Premium Ativo | ✂️ Cortes: {assinaturaAtiva.creditosCorte} | 🧔 Barbas: {assinaturaAtiva.creditosBarba}
               </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Profissional</label>
            <div className="relative">
              <select
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 appearance-none"
                required
              >
                <option value="" disabled>Selecione o barbeiro</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#D4AF37]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-2">
            <h3 className="text-lg font-bold text-[#D4AF37]">Itens do Serviço/Produto</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs flex items-center gap-1 text-[#E5E5E5] bg-[#121212] px-3 py-1.5 rounded-md border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors uppercase font-medium tracking-wider"
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#121212] p-4 rounded-lg border border-[#D4AF37]/10">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Item</label>
                  <select
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="w-full bg-transparent appearance-none text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 leading-tight"
                    required
                  >
                    <option value="" disabled className="bg-[#121212]">Selecione um serviço/produto</option>
                    {catalog.map(c => (
                      <option key={c.id} value={c.name} className="bg-[#121212]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-24 space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full bg-transparent text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 text-center font-medium"
                    required
                  />
                </div>

                <div className="w-full md:w-32 space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Preço Un (R$)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1 text-[#E5E5E5]/50 text-sm pl-2">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.usouCreditoAssinatura ? 0 : item.price}
                      readOnly={item.usouCreditoAssinatura}
                      onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                      className={`w-full bg-transparent text-[#D4AF37] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] py-1 pl-8 pr-2 font-bold ${item.usouCreditoAssinatura ? 'opacity-50' : ''}`}
                      required
                    />
                  </div>
                </div>

                {assinaturaAtiva && (
                    <div className="w-full md:w-auto mt-2 md:mt-2 flex items-center justify-center">
                       <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold tracking-wider uppercase text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1.5 rounded-lg border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors">
                         <input 
                            type="checkbox" 
                            checked={item.usouCreditoAssinatura || false}
                            onChange={(e) => handleItemChange(item.id, 'usouCreditoAssinatura', e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#D4AF37] border-none rounded"
                         />
                         Usar Crédito
                       </label>
                    </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                  className="mt-4 md:mt-0 p-2 text-[#E5E5E5]/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed mx-auto md:mx-0 flex"
                  title="Remover item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/20 pt-6 flex flex-col items-end gap-6">
          <div className="text-right">
            <p className="text-[#E5E5E5]/60 text-sm uppercase tracking-wider font-semibold mb-1">Total da Transação</p>
            <p className="text-4xl font-bold font-serif text-[#D4AF37]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Processando...' : 'Finalizar Transação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Transacoes;
