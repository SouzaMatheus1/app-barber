import React, { useState, useEffect, useCallback } from 'react';
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
  tipo: 'corte' | 'barba' | 'outro';
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

function resolveItemTipo(name: string): CatalogItem['tipo'] {
  const n = name.toLowerCase();
  if (n.includes('barba') || n.includes('bigode')) return 'barba';
  if (n.includes('corte') || n.includes('cabelo') || n.includes('degrad')) return 'corte';
  return 'outro';
}

// ─── Component ────────────────────────────────────────────────────────────────

const Transacoes: React.FC = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova');

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
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false }
  ]);

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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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
            price: Number(c.preco),
            tipo: resolveItemTipo(c.nome),
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
    if (!assinaturaAtiva || !assinaturaAtiva.plano) return 0;
    const totalItens = assinaturaAtiva.plano.itens.reduce((acc, i) => acc + i.quantidade, 0);
    if (totalItens === 0) return 0;
    return (assinaturaAtiva.plano.valorMensal || 0) / totalItens;
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
        descricao: `Atendimento: ${clientName || 'Avulso'}`,
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
      data: new Date(t.data).toISOString().slice(0, 16) // datetime-local format
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D4AF37]/20 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Transações</h1>
          <p className="text-[#E5E5E5]/60 mt-1">Registre ou visualize o histórico financeiro.</p>
        </div>
        <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-[#D4AF37]/20">
          <button 
            type="button"
            onClick={() => setActiveTab('nova')}
            className={`px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'nova' ? 'bg-[#D4AF37] text-[#121212]' : 'text-[#E5E5E5]/60 hover:text-[#D4AF37]'}`}
          >
            <Plus size={16} /> Nova
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${activeTab === 'historico' ? 'bg-[#D4AF37] text-[#121212]' : 'text-[#E5E5E5]/60 hover:text-[#D4AF37]'}`}
          >
            <History size={16} /> Histórico
          </button>
        </div>
      </header>

      {activeTab === 'nova' && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 shadow-lg p-6 md:p-8 space-y-8 relative overflow-hidden"
        >
          {success && (
            <div className="absolute inset-0 bg-[#121212]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={64} className="text-[#D4AF37] mb-4" />
              <h2 className="text-2xl font-bold text-[#E5E5E5]">Transação Registrada!</h2>
              <p className="text-[#D4AF37] mt-2 text-lg">Sucesso na operação.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Cliente */}
            <div className="space-y-2 z-10 relative">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">
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
                  className={`w-full px-4 py-3 bg-[#121212] rounded-lg border border-[#D4AF37]/30 outline-none transition-colors ${selectedClientId ? 'text-[#D4AF37] font-bold' : 'text-[#E5E5E5]'}`}
                  placeholder="Ex: João Silva ou Avulso"
                  autoComplete="off"
                />
                
                {showSuggestions && (
                  <div className="absolute z-50 w-full bg-[#1a1a1a] border border-t-0 border-[#D4AF37]/30 rounded-b-lg max-h-48 overflow-y-auto shadow-2xl">
                    {allClientes.filter(c => c.nome.toLowerCase().includes(clientName.toLowerCase())).map(cliente => (
                      <div
                        key={cliente.id}
                        onClick={() => selectClient(cliente)}
                        className="px-4 py-3 cursor-pointer hover:bg-[#D4AF37]/10 text-[#E5E5E5] border-b border-[#D4AF37]/10 last:border-0 transition-colors flex items-center gap-3"
                      >
                        <User size={16} className="text-[#D4AF37]" />
                        <div>
                          <div className="font-bold text-sm tracking-wide">{cliente.nome}</div>
                          <div className="text-[10px] text-[#E5E5E5]/40 mt-0.5">{cliente.telefone || 'Sem telefone'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loadingAssinatura && (
                <div className="flex items-center gap-2 mt-2 text-[#D4AF37]/60 text-xs">
                  <Loader2 size={12} className="animate-spin" /> Verificando assinatura...
                </div>
              )}
              {!loadingAssinatura && assinaturaAtiva && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  {assinaturaAtiva.status === 'ATIVA' ? (
                    <>
                      <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#121212] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                        <Crown size={13} />
                        Assinante Ativo — {assinaturaAtiva.plano.nome}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                         {assinaturaAtiva.creditos?.map(cred => (
                           <span key={cred.id} className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border ${cred.quantidadeRestante > 0 ? 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'text-red-500/50 bg-red-500/5 border-red-500/10'}`}>
                             {cred.item?.nome}: {cred.quantidadeRestante}
                           </span>
                         ))}
                         {(!assinaturaAtiva.creditos || assinaturaAtiva.creditos.length === 0) && (
                           <span className="text-[11px] text-[#E5E5E5]/40 italic">Sem créditos associados a este plano.</span>
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
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">
                Profissional
              </label>
              <select
                value={professional}
                onChange={e => setProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:border-[#D4AF37] outline-none"
                required
              >
                <option value="" disabled>Selecione o barbeiro</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamentoId}
                onChange={e => setFormaPagamentoId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:border-[#D4AF37] outline-none"
              >
                <option value={1}>PIX</option>
                <option value={2}>Cartão de Crédito</option>
                <option value={3}>Cartão de Débito</option>
                <option value={4}>Dinheiro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">
                Data
              </label>
              <input
                type="datetime-local"
                value={dataPersonalizada}
                style={{ colorScheme: 'light' }}
                onChange={e => setDataPersonalizada(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:border-[#D4AF37] outline-none"
              />
            </div>

          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-2">
              <h3 className="text-lg font-bold text-[#D4AF37]">Itens</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-xs flex items-center gap-1 text-[#E5E5E5] bg-[#121212] px-3 py-1.5 rounded-md border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors uppercase font-medium tracking-wider"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-3">
              {cartItems.map(item => {
                const creditEnabled = isCreditToggleEnabled(item);
                const displayPrice = item.usouCredito ? getValorProporcional() : item.originalPrice;

                return (
                  <div key={item.uuid} className="flex flex-col md:flex-row gap-4 bg-[#121212] p-4 rounded-lg border border-[#D4AF37]/10">
                    <div className="flex-1">
                      <select
                        value={item.name}
                        onChange={e => handleItemSelect(item.uuid, e.target.value)}
                        className="w-full bg-transparent appearance-none text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1"
                        required
                      >
                        <option value="" disabled className="bg-[#1a1a1a]">Selecione...</option>
                        {catalog.map(c => <option key={c.id} value={c.name} className="bg-[#1a1a1a]">{c.name}</option>)}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number" min="1" value={item.quantity}
                        onChange={e => handleQtyChange(item.uuid, Number(e.target.value))}
                        className="w-full bg-transparent text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 text-center"
                        required
                      />
                    </div>

                    <div className="w-32">
                      <div className="relative">
                        <span className="absolute left-1 top-1 text-[#E5E5E5]/50 text-sm">R$</span>
                        <input
                          readOnly value={displayPrice.toFixed(2)}
                          className={`w-full bg-transparent border-b border-[#D4AF37]/30 py-1 pl-8 font-bold ${item.usouCredito ? 'text-[#D4AF37]/80' : 'text-[#D4AF37]'}`}
                        />
                      </div>
                    </div>

                    {assinaturaAtiva && (
                      <div className="flex items-center">
                        <label className={`flex gap-2 text-[11px] font-bold uppercase px-2 py-2 rounded-lg border cursor-pointer ${creditEnabled ? 'text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10' : 'opacity-50 pointer-events-none'}`}>
                          <input type="checkbox" disabled={!creditEnabled} checked={item.usouCredito} onChange={e => handleCreditToggle(item.uuid, e.target.checked)} className="accent-[#D4AF37]" />
                          {creditEnabled ? getCreditLabel(item) : 'Sem Crédito'}
                        </label>
                      </div>
                    )}

                    <button type="button" onClick={() => removeItem(item.uuid)} disabled={cartItems.length === 1} className="p-2 text-[#E5E5E5]/40 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#D4AF37]/20 pt-6 flex flex-col justify-end items-end gap-6">
            <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-xl p-6 w-full md:w-80">
              <div className="flex items-center justify-between text-[#D4AF37]">
                <span className="font-bold uppercase tracking-wider text-sm">Total a Pagar</span>
                <span className="text-3xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAPagar)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="px-10 py-4 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-all text-sm w-full md:w-auto">
              Finalizar Transação
            </button>
          </div>
        </form>
      )}

      {activeTab === 'historico' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg animate-in slide-in-from-bottom-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#121212]">
                  <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Data</th>
                  <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Descrição / Cliente</th>
                  <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Pagamento</th>
                  <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Valor</th>
                  <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/10">
                {loadingHistory ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#D4AF37]"><Loader2 className="animate-spin inline" /></td></tr>
                ) : transacoes.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#E5E5E5]/50">Nenhuma transação encontrada.</td></tr>
                ) : transacoes.map(t => (
                  <tr key={t.id} className="hover:bg-[#D4AF37]/5">
                    <td className="py-4 px-6 text-[#E5E5E5] font-medium">{new Date(t.data).toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-6 text-[#E5E5E5]/80">{t.descricao || 'Sem descrição'}</td>
                    <td className="py-4 px-6 text-[#D4AF37] font-bold text-xs uppercase tracking-widest">{t.metodoPagamento?.descricao || '-'}</td>
                    <td className="py-4 px-6 text-[#D4AF37] font-bold">R$ {Number(t.valorTotal).toFixed(2)}</td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button onClick={() => openEditModal(t)} className="text-[#E5E5E5]/50 hover:text-[#D4AF37]"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(t.id)} className="text-[#E5E5E5]/50 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditSubmit} className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#D4AF37]/30 shadow-2xl relative">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-6 border-b border-[#D4AF37]/20 pb-4">Editar Transação</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Data/Hora</label>
                <input type="datetime-local" required value={editData.data} style={{ colorScheme: 'light' }} onChange={e => setEditData({...editData, data: e.target.value})} className="w-full mt-1 p-3 bg-[#121212] text-white rounded border border-[#D4AF37]/20" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Valor (R$)</label>
                <input type="number" step="0.01" required value={editData.valorTotal} onChange={e => setEditData({...editData, valorTotal: e.target.value})} className="w-full mt-1 p-3 bg-[#121212] text-white rounded border border-[#D4AF37]/20" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Pagamento</label>
                <select value={editData.formaPagamentoId} onChange={e => setEditData({...editData, formaPagamentoId: e.target.value})} className="w-full mt-1 p-3 bg-[#121212] text-white rounded border border-[#D4AF37]/20">
                  <option value={1}>PIX</option>
                  <option value={2}>Cartão de Crédito</option>
                  <option value={3}>Cartão de Débito</option>
                  <option value={4}>Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Descrição</label>
                <input type="text" value={editData.descricao} onChange={e => setEditData({...editData, descricao: e.target.value})} className="w-full mt-1 p-3 bg-[#121212] text-white rounded border border-[#D4AF37]/20" />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-[#E5E5E5]/60 hover:text-white uppercase text-xs font-bold transition-colors">Cancelar</button>
              <button type="submit" disabled={loadingEdit} className="px-6 py-2 bg-[#D4AF37] text-black font-bold uppercase text-xs rounded hover:bg-[#E5C158] transition-colors">{loadingEdit ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Transacoes;
