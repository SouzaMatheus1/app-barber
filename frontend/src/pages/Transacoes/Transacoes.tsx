import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Trash2, CheckCircle2, Loader2, Crown, User, Edit2, History } from 'lucide-react';
import { transacaoService } from '../../services/TransacaoService';
import { assinaturaService } from '../../services/AssinaturaService';
import { ClienteService } from '../../services/ClienteService';

const clienteService = new ClienteService();

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssinaturaAtiva {
  id: number;
  planoId: number;
  status: 'ATIVA' | 'INATIVA';
  valorProporcional?: number;
  plano: { 
    id: number; 
    nome: string; 
    valorMensal: number; 
    itens: { id: number; quantidade: number }[] 
  };
  creditos: {
    id: number;
    itemId: number;
    quantidadeRestante: number;
    item: { nome: string };
  }[];
}

interface CatalogItem {
  id: number;
  name: string;
  price: number;
}

interface CartItem {
  uuid: string;
  itemId?: number;
  name: string;
  quantity: number;
  originalPrice: number;
  usouCredito: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

const Transacoes: React.FC = () => {
  const location = useLocation();
  // Tabs
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>(
    (location.state as any)?.tab === 'historico' ? 'historico' : 'nova'
  );

  // Form state
  const getFormatDataAtual = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [professional, setProfessional] = useState('');
  const [formaPagamentoId, setFormaPagamentoId] = useState<number>(1);
  const [dataPersonalizada, setDataPersonalizada] = useState<string>(getFormatDataAtual());
  
  const [descricao, setDescricao] = useState('Atendimento: Avulso');
  const [descricaoDirty, setDescricaoDirty] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([
    { uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false }
  ]);

  useEffect(() => {
    if (!descricaoDirty) {
      const itensNomes = cartItems
        .filter(item => item.name)
        .map(item => `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`)
        .join(', ');
      
      setDescricao(itensNomes || `Atendimento: ${clientName || 'Avulso'}`);
    }
  }, [clientName, cartItems, descricaoDirty]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Data
  const [allClientes, setAllClientes] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [profissionais, setProfissionais] = useState<{ id: number; nome: string }[]>([]);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaAtiva | null>(null);
  const [loadingAssinatura, setLoadingAssinatura] = useState(false);

  // History State
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const filteredTransacoes = transacoes.filter(t => {
    const d = new Date(t.data).toLocaleDateString('en-CA');
    if (historyStartDate && d < historyStartDate) return false;
    if (historyEndDate && d > historyEndDate) return false;
    return true;
  });

  // ── Load static data ──
  useEffect(() => {
    (async () => {
      try {
        const [catData, profData] = await Promise.all([
          transacaoService.getCatalogo(),
          transacaoService.getProfissionais(),
        ]);
        setCatalog(
          catData.map((c: any) => ({
            id: c.id,
            name: c.nome,
            price: Number(c.preco)
          }))
        );
        setProfissionais(profData);
        
        try {
          const cliData = await clienteService.listar(); 
          setAllClientes(cliData);
        } catch {
          const { api } = await import('../../services/api');
          const cliRes = await api.get('/clientes');
          setAllClientes(cliRes.data);
        }
      } catch (err) {
        console.error('Erro ao carregar dados base:', err);
      }
    })();
  }, []);

  // ── Fetch History ──
  useEffect(() => {
    if (activeTab === 'historico') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await transacaoService.listar();
      setTransacoes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchAssinatura = useCallback(async (clienteId: number) => {
    setLoadingAssinatura(true);
    try {
      const ativa = await assinaturaService.getAssinaturaAtiva(clienteId);
      setAssinaturaAtiva(ativa ?? null);
    } catch {
      setAssinaturaAtiva(null);
    } finally {
      setLoadingAssinatura(false);
    }
  }, []);

  const selectClient = (cliente: any) => {
    setClientName(cliente.nome);
    setSelectedClientId(cliente.id);
    setShowSuggestions(false);
    setCartItems(prev => prev.map(i => ({ ...i, usouCredito: false })));
    fetchAssinatura(cliente.id);
  };

  const addItem = () => {
    setCartItems(prev => [
      ...prev,
      { uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false },
    ]);
  };

  const removeItem = (uuid: string) => {
    setCartItems(prev => prev.length > 1 ? prev.filter(i => i.uuid !== uuid) : prev);
  };

  const handleItemSelect = (uuid: string, name: string) => {
    const found = catalog.find(c => c.name === name);
    setCartItems(prev =>
      prev.map(item =>
        item.uuid === uuid
          ? { ...item, name, itemId: found?.id, originalPrice: found?.price ?? 0, usouCredito: false }
          : item
      )
    );
  };

  const handleQtyChange = (uuid: string, qty: number) => {
    setCartItems(prev =>
      prev.map(item => (item.uuid === uuid ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleCreditToggle = (uuid: string, checked: boolean) => {
    setCartItems(prev =>
      prev.map(item => (item.uuid === uuid ? { ...item, usouCredito: checked } : item))
    );
  };

  const getValorProporcional = useCallback((): number => { 
    return assinaturaAtiva?.valorProporcional ?? 0;
  }, [assinaturaAtiva]);

  const totalAPagar = cartItems.reduce((acc, item) => {
    if (item.usouCredito) return acc;
    return acc + item.originalPrice * item.quantity;
  }, 0);

  const isCreditToggleEnabled = (item: CartItem): boolean => {
    if (!assinaturaAtiva || !item.itemId || assinaturaAtiva.status !== 'ATIVA') return false;
    const credito = assinaturaAtiva.creditos.find(c => c.itemId === item.itemId);
    return !!credito && credito.quantidadeRestante > 0;
  };

  const getCreditLabel = (item: CartItem): string => {
    if (!assinaturaAtiva || !item.itemId) return 'Usar Crédito';
    const credito = assinaturaAtiva.creditos.find(c => c.itemId === item.itemId);
    if (!credito) return 'Não incluso no plano';
    return `Crédito ${credito.item.nome} (${credito.quantidadeRestante} disp.)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const itensValidos = cartItems.filter(i => i.itemId !== undefined);
      if (itensValidos.length === 0) {
        alert('Selecione ao menos um item válido do catálogo.');
        return;
      }

      await transacaoService.create({
        descricao: descricao.trim() || `Atendimento: ${clientName || 'Avulso'}`,
        tipoTransacaoId: 1,
        profissionalId: Number(professional),
        clienteId: selectedClientId,
        formaPagamentoId: Number(formaPagamentoId),
        data: dataPersonalizada ? new Date(dataPersonalizada).toISOString() : undefined,
        itens: itensValidos.map(i => ({
          itemId: i.itemId!,
          quantidade: i.quantity,
          usouCreditoAssinatura: i.usouCredito,
        })),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setClientName('');
        setSelectedClientId(null);
        setAssinaturaAtiva(null);
        setProfessional('');
        setFormaPagamentoId(1);
        setDataPersonalizada(getFormatDataAtual());
        setDescricaoDirty(false);
        setDescricao('Atendimento: Avulso');
        setCartItems([{ uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false }]);
      }, 2500);
    } catch (error) {
      console.error('Erro ao registrar transação', error);
      alert('Erro ao registrar a transação. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (t: any) => {
    setEditData({
      id: t.id,
      descricao: t.descricao || '',
      valorTotal: t.valorTotal,
      formaPagamentoId: t.formaPagamentoId || 1,
      data: new Date(new Date(t.data).getTime() - new Date(t.data).getTimezoneOffset() * 60000).toISOString().slice(0, 16) // datetime-local format
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEdit(true);
    try {
      await transacaoService.editar(editData.id, {
        descricao: editData.descricao,
        valorTotal: Number(editData.valorTotal),
        formaPagamentoId: Number(editData.formaPagamentoId),
        data: new Date(editData.data).toISOString()
      });
      setEditModalOpen(false);
      loadHistory();
    } catch (err) {
      alert("Erro ao editar transação");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente cancelar esta transação?")) return;
    try {
      await transacaoService.deletar(id);
      loadHistory();
    } catch (err) {
      alert("Erro ao deletar");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-primary)]/20 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)]">Transações</h1>
          <p className="text-[var(--color-text)]/60 mt-1">Registre ou visualize o histórico financeiro.</p>
        </div>
        <div className="flex bg-[var(--color-surface)] rounded-lg p-1 border border-[var(--color-primary)]/20">
          <button 
            type="button"
            onClick={() => setActiveTab('nova')}
            className={`px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'nova' ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]'}`}
          >
            <Plus size={16} /> Nova
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'historico' ? 'bg-[var(--color-primary)] text-[var(--color-background)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]'}`}
          >
            <History size={16} /> Histórico
          </button>
        </div>
      </header>

      {activeTab === 'nova' && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-primary)]/20 shadow-lg p-6 md:p-8 space-y-8 relative overflow-hidden"
        >
          {success && (
            <div className="absolute inset-0 bg-[var(--color-background)]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={64} className="text-[var(--color-primary)] mb-4" />
              <h2 className="text-2xl font-bold text-[var(--color-text)]">Transação Registrada!</h2>
              <p className="text-[var(--color-primary)] mt-2 text-lg">Sucesso na operação.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Cliente */}
            <div className="space-y-2 z-10 relative">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Nome do Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientName}
                  onChange={e => {
                     setClientName(e.target.value);
                     setSelectedClientId(null);
                     setAssinaturaAtiva(null);
                     setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`w-full px-4 py-3 bg-[var(--color-background)] rounded-lg border border-[var(--color-primary)]/30 outline-none transition-colors ${selectedClientId ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text)]'}`}
                  placeholder="Ex: João Silva ou Avulso"
                  autoComplete="off"
                />
                
                {showSuggestions && (
                  <div className="absolute z-50 w-full bg-[var(--color-surface)] border border-t-0 border-[var(--color-primary)]/30 rounded-b-lg max-h-48 overflow-y-auto shadow-2xl">
                    {allClientes.filter(c => c.nome.toLowerCase().includes(clientName.toLowerCase())).map(cliente => (
                      <div
                        key={cliente.id}
                        onClick={() => selectClient(cliente)}
                        className="px-4 py-3 cursor-pointer hover:bg-[var(--color-primary)]/10 text-[var(--color-text)] border-b border-[var(--color-primary)]/10 last:border-0 transition-colors flex items-center gap-3"
                      >
                        <User size={16} className="text-[var(--color-primary)]" />
                        <div>
                          <div className="font-bold text-sm tracking-wide">{cliente.nome}</div>
                          <div className="text-[10px] text-[var(--color-text)]/40 mt-0.5">{cliente.telefone || 'Sem telefone'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loadingAssinatura && (
                <div className="flex items-center gap-2 mt-2 text-[var(--color-primary)]/60 text-xs">
                  <Loader2 size={12} className="animate-spin" /> Verificando assinatura...
                </div>
              )}
              {!loadingAssinatura && assinaturaAtiva && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  {assinaturaAtiva.status === 'ATIVA' ? (
                    <>
                      <div className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-background)] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                        <Crown size={13} />
                        Assinante Ativo — {assinaturaAtiva.plano.nome}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                         {assinaturaAtiva.creditos?.map(cred => (
                           <span key={cred.id} className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border ${cred.quantidadeRestante > 0 ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20' : 'text-red-500/50 bg-red-500/5 border-red-500/10'}`}>
                             {cred.item?.nome}: {cred.quantidadeRestante}
                           </span>
                         ))}
                         {(!assinaturaAtiva.creditos || assinaturaAtiva.creditos.length === 0) && (
                           <span className="text-[11px] text-[var(--color-text)]/40 italic">Sem créditos associados a este plano.</span>
                         )}
                      </div>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md">
                      Plano Inativo — {assinaturaAtiva.plano.nome}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profissional */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Profissional
              </label>
              <select
                value={professional}
                onChange={e => setProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
                required
              >
                <option value="" disabled>Selecione o barbeiro</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamentoId}
                onChange={e => setFormaPagamentoId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
              >
                <option value={1}>PIX</option>
                <option value={2}>Cartão de Crédito</option>
                <option value={3}>Cartão de Débito</option>
                <option value={4}>Dinheiro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Data
              </label>
              <input
                type="datetime-local"
                value={dataPersonalizada}
                style={{ colorScheme: 'light' }}
                onChange={e => setDataPersonalizada(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={e => {
                  setDescricao(e.target.value);
                  setDescricaoDirty(true);
                }}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
                placeholder="Ex: Atendimento: João Silva"
              />
            </div>

          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-[var(--color-primary)]/20 pb-2">
              <h3 className="text-lg font-bold text-[var(--color-primary)]">Itens</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs flex items-center gap-1 text-[var(--color-text)] bg-[var(--color-background)] px-3 py-1.5 rounded-md border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors uppercase font-medium tracking-wider"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {cartItems.map(item => {
                const creditEnabled = isCreditToggleEnabled(item);
                const displayPrice = item.usouCredito ? getValorProporcional() : item.originalPrice;

                return (
                  <div key={item.uuid} className="flex flex-col md:flex-row gap-4 bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-primary)]/10">
                    <div className="flex-1">
                      <select
                        value={item.name}
                        onChange={e => handleItemSelect(item.uuid, e.target.value)}
                        className="w-full bg-transparent appearance-none text-[var(--color-text)] border-b border-[var(--color-primary)]/30 focus:outline-none focus:border-[var(--color-primary)] px-2 py-1"
                        required
                      >
                        <option value="" disabled className="bg-[var(--color-surface)]">Selecione...</option>
                        {catalog.map(c => <option key={c.id} value={c.name} className="bg-[var(--color-surface)]">{c.name}</option>)}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={e => handleQtyChange(item.uuid, Number(e.target.value))}
                        className="w-full bg-transparent text-[var(--color-text)] border-b border-[var(--color-primary)]/30 focus:outline-none focus:border-[var(--color-primary)] px-2 py-1 text-center"
                        required
                      />
                    </div>

                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-1 top-1 text-[var(--color-text)]/50 text-sm">R$</span>
                        <input
                          readOnly value={displayPrice.toFixed(2)}
                          className={`w-full bg-transparent border-b border-[var(--color-primary)]/30 py-1 pl-8 font-bold ${item.usouCredito ? 'text-[var(--color-primary)]/80' : 'text-[var(--color-primary)]'}`}
                        />
                      </div>
                    </div>

                    {assinaturaAtiva && (
                      <div className="flex items-center">
                        <label className={`flex gap-2 text-[11px] font-bold uppercase px-2 py-2 rounded-lg border cursor-pointer ${creditEnabled ? 'text-[var(--color-primary)] border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10' : 'opacity-50 pointer-events-none'}`}>
                          <input type="checkbox" disabled={!creditEnabled} checked={item.usouCredito} onChange={e => handleCreditToggle(item.uuid, e.target.checked)} className="accent-[var(--color-primary)]" />
                          {creditEnabled ? getCreditLabel(item) : 'Sem Crédito'}
                        </label>
                      </div>
                    )}

                    <button type="button" onClick={() => removeItem(item.uuid)} disabled={cartItems.length === 1} className="p-2 text-[var(--color-text)]/40 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[var(--color-primary)]/20 pt-6 flex flex-col justify-end items-end gap-6">
            <div className="bg-[var(--color-background)] border border-[var(--color-primary)]/20 rounded-xl p-6 w-full md:w-80">
              <div className="flex items-center justify-between text-[var(--color-primary)]">
                <span className="font-bold uppercase tracking-wider text-sm">Total a Pagar</span>
                <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAPagar)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="px-10 py-4 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-all text-sm w-full md:w-auto">
              Finalizar Transação
            </button>
          </div>
        </form>
      )}

      {activeTab === 'historico' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 p-4 shadow-lg sm:items-center gap-4">
            <h2 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-widest hidden md:block">Filtros:</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[var(--color-text)]/60 uppercase tracking-wider">Início:</label>
                <input 
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-[var(--color-background)] text-[var(--color-text)] px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none text-sm cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[var(--color-text)]/60 uppercase tracking-wider">Fim:</label>
                <input 
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="bg-[var(--color-background)] text-[var(--color-text)] px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none text-sm cursor-pointer"
                />
              </div>
              {(historyStartDate || historyEndDate) && (
                <button 
                  onClick={() => {
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                  }}
                  className="text-[10px] bg-[var(--color-background)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] px-2 py-1.5 rounded-md hover:bg-[var(--color-primary)]/10 transition-colors uppercase font-bold tracking-wider"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-background)]">
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Data</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Descrição</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Cliente</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Pagamento</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Valor</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-primary)]/10">
                {loadingHistory ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[var(--color-primary)]"><Loader2 className="animate-spin inline" /></td></tr>
                ) : filteredTransacoes.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[var(--color-text)]/50">Nenhuma transação encontrada.</td></tr>
                ) : filteredTransacoes.map(t => (
                  <tr key={t.id} className="hover:bg-[var(--color-primary)]/5">
                    <td className="py-4 px-6 text-[var(--color-text)] font-medium">{new Date(t.data).toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">{t.descricao || 'Sem descrição'}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">{t.cliente?.nome || 'Cliente Avulso'}</td>
                    <td className="py-4 px-6 text-[var(--color-primary)] font-bold text-xs uppercase tracking-widest">{t.metodoPagamento?.descricao || '-'}</td>
                    <td className="py-4 px-6 text-[var(--color-primary)] font-bold">R$ {Number(t.valorTotal).toFixed(2)}</td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button onClick={() => openEditModal(t)} className="text-[var(--color-text)]/50 hover:text-[var(--color-primary)]"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-[var(--color-text)]/50 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditSubmit} className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-md border border-[var(--color-primary)]/30 shadow-2xl relative">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6 border-b border-[var(--color-primary)]/20 pb-4">Editar Transação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase">Data/Hora</label>
                <input type="datetime-local" required value={editData.data} style={{ colorScheme: 'light' }} onChange={e => setEditData({...editData, data: e.target.value})} className="w-full mt-1 p-3 bg-[var(--color-background)] text-white rounded border border-[var(--color-primary)]/20" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase">Valor (R$)</label>
                <input type="number" step="0.01" required value={editData.valorTotal} onChange={e => setEditData({...editData, valorTotal: e.target.value})} className="w-full mt-1 p-3 bg-[var(--color-background)] text-white rounded border border-[var(--color-primary)]/20" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase">Pagamento</label>
                <select value={editData.formaPagamentoId} onChange={e => setEditData({...editData, formaPagamentoId: e.target.value})} className="w-full mt-1 p-3 bg-[var(--color-background)] text-white rounded border border-[var(--color-primary)]/20">
                  <option value={1}>PIX</option>
                  <option value={2}>Cartão de Crédito</option>
                  <option value={3}>Cartão de Débito</option>
                  <option value={4}>Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase">Descrição</label>
                <input type="text" value={editData.descricao} onChange={e => setEditData({...editData, descricao: e.target.value})} className="w-full mt-1 p-3 bg-[var(--color-background)] text-white rounded border border-[var(--color-primary)]/20" />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-[var(--color-text)]/60 hover:text-white uppercase text-xs font-bold transition-colors">Cancelar</button>
              <button type="submit" disabled={loadingEdit} className="px-6 py-2 bg-[var(--color-primary)] text-black font-bold uppercase text-xs rounded hover:bg-[var(--color-secondary)] transition-colors">{loadingEdit ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Transacoes;
