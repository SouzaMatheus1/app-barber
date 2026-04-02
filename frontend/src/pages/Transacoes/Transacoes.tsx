import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, CheckCircle2, Loader2, Crown, Scissors } from 'lucide-react';
import { transacaoService } from '../../services/TransacaoService';
import { assinaturaService } from '../../services/AssinaturaService';
import { ClienteService } from '../../services/ClienteService';

const clienteService = new ClienteService();

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssinaturaAtiva {
  id: number;
  planoId: number;
  creditosCorte: number;
  creditosBarba: number;
  status: 'ATIVA' | 'INATIVA';
  plano: { id: number; nome: string };
}

interface CatalogItem {
  id: number;
  name: string;
  price: number;
  /** Tipo do item para validar créditos */
  tipo: 'corte' | 'barba' | 'outro';
}

interface CartItem {
  /** UUID local */
  uuid: string;
  /** id do item no catálogo (undefined enquanto não selecionado) */
  itemId?: number;
  name: string;
  quantity: number;
  originalPrice: number;
  usouCredito: boolean;
}

interface TransacaoPayloadItem {
  itemId: number;
  quantidade: number;
  usouCreditoAssinatura: boolean;
}

interface TransacaoPayload {
  descricao: string;
  tipoTransacaoId: number;
  profissionalId: number;
  clienteId: number | null;
  itens: TransacaoPayloadItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveItemTipo(name: string): CatalogItem['tipo'] {
  const n = name.toLowerCase();
  if (n.includes('barba') || n.includes('bigode')) return 'barba';
  if (n.includes('corte') || n.includes('cabelo') || n.includes('degrad')) return 'corte';
  return 'outro';
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── Component ────────────────────────────────────────────────────────────────

const Transacoes: React.FC = () => {
  // Form state
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [professional, setProfessional] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false }
  ]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Data
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [profissionais, setProfissionais] = useState<{ id: number; nome: string }[]>([]);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState<AssinaturaAtiva | null>(null);
  const [loadingAssinatura, setLoadingAssinatura] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      } catch (err) {
        console.error('Erro ao carregar dados base:', err);
      }
    })();
  }, []);

  // ── Fetch assinatura quando um cliente é selecionado ──
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

  // ── Client search with debounce ──
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientName(value);
    setSelectedClientId(null);
    setAssinaturaAtiva(null);
    setShowSuggestions(true);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length >= 2) {
      setIsSearchingClient(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await clienteService.search(value);
          setClientSuggestions(results);
        } catch {
          console.error('Erro na busca de clientes');
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
    setSelectedClientId(cliente.id);
    setShowSuggestions(false);
    setClientSuggestions([]);
    // Reset créditos usados ao trocar cliente
    setCartItems(prev => prev.map(i => ({ ...i, usouCredito: false })));
    fetchAssinatura(cliente.id);
  };

  // ── Cart management ──
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

  // ── Derived calculations ──
  const total = cartItems.reduce((acc, item) => {
    if (item.usouCredito) return acc;
    return acc + item.originalPrice * item.quantity;
  }, 0);

  const isCreditToggleEnabled = (item: CartItem): boolean => {
    if (!assinaturaAtiva || !item.itemId || assinaturaAtiva.status !== 'ATIVA') return false;
    const catalogItem = catalog.find(c => c.id === item.itemId);
    if (!catalogItem || catalogItem.tipo === 'outro') return false;
    if (catalogItem.tipo === 'barba') return assinaturaAtiva.creditosBarba > 0;
    // corte (default para qualquer serviço não classificado como barba)
    return assinaturaAtiva.creditosCorte > 0;
  };

  const getCreditLabel = (item: CartItem): string => {
    const catalogItem = catalog.find(c => c.id === item.itemId);
    if (!catalogItem || !assinaturaAtiva) return 'Usar Crédito';
    if (catalogItem.tipo === 'barba') return `Crédito Barba (${assinaturaAtiva.creditosBarba} disp.)`;
    return `Crédito Corte (${assinaturaAtiva.creditosCorte} disp.)`;
  };

  // ── Submit ──
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

      const payload: TransacaoPayload = {
        descricao: `Atendimento: ${clientName || 'Avulso'}`,
        tipoTransacaoId: 1,
        profissionalId: Number(professional),
        clienteId: selectedClientId,
        itens: itensValidos.map(i => ({
          itemId: i.itemId!,
          quantidade: i.quantity,
          usouCreditoAssinatura: i.usouCredito,
        })),
      };

      await transacaoService.create(payload);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setClientName('');
        setSelectedClientId(null);
        setAssinaturaAtiva(null);
        setProfessional('');
        setCartItems([{ uuid: crypto.randomUUID(), itemId: undefined, name: '', quantity: 1, originalPrice: 0, usouCredito: false }]);
      }, 2500);
    } catch (error) {
      console.error('Erro ao registrar transação', error);
      alert('Erro ao registrar a transação. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Nova Transação</h1>
        <p className="text-[#E5E5E5]/60 mt-1">Registre um novo atendimento ou venda.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 shadow-lg p-6 md:p-8 space-y-8 relative overflow-hidden"
      >
        {/* ── Overlay de Sucesso ── */}
        {success && (
          <div className="absolute inset-0 bg-[#121212]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={64} className="text-[#D4AF37] mb-4" />
            <h2 className="text-2xl font-bold text-[#E5E5E5]">Transação Registrada!</h2>
            <p className="text-[#D4AF37] mt-2 text-lg">Sucesso na operação.</p>
          </div>
        )}

        {/* ── Cliente + Profissional ── */}
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
                onChange={handleClientNameChange}
                onFocus={() => { if (clientSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 placeholder-[#E5E5E5]/30"
                placeholder="Ex: João Silva ou Avulso"
                autoComplete="off"
              />
              {isSearchingClient && (
                <div className="absolute right-3 top-3.5 text-[#D4AF37]">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}
              {showSuggestions && clientSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {clientSuggestions.map(cliente => (
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

            {/* ── Badge de Assinante ── */}
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
                      {assinaturaAtiva.creditosCorte > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-1 rounded">
                          <Scissors size={11} /> Cortes: {assinaturaAtiva.creditosCorte}
                        </span>
                      )}
                      {assinaturaAtiva.creditosBarba > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-1 rounded">
                          🧔 Barbas: {assinaturaAtiva.creditosBarba}
                        </span>
                      )}
                      {assinaturaAtiva.creditosCorte === 0 && assinaturaAtiva.creditosBarba === 0 && (
                        <span className="text-[11px] text-[#E5E5E5]/40 italic">Sem créditos disponíveis neste mês.</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md">
                    <Crown size={13} className="opacity-50" />
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
            <div className="relative">
              <select
                value={professional}
                onChange={e => setProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 appearance-none"
                required
              >
                <option value="" disabled>Selecione o barbeiro</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#D4AF37]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carrinho de Itens ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-2">
            <h3 className="text-lg font-bold text-[#D4AF37]">Itens do Serviço / Produto</h3>
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
              const displayPrice = item.usouCredito ? 0 : item.originalPrice;

              return (
                <div
                  key={item.uuid}
                  className={`flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#121212] p-4 rounded-lg border transition-all duration-200 ${
                    item.usouCredito ? 'border-[#D4AF37]/40 shadow-[0_0_8px_rgba(212,175,55,0.15)]' : 'border-[#D4AF37]/10'
                  }`}
                >
                  {/* Serviço */}
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Item</label>
                    <select
                      value={item.name}
                      onChange={e => handleItemSelect(item.uuid, e.target.value)}
                      className="w-full bg-transparent appearance-none text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 leading-tight"
                      required
                    >
                      <option value="" disabled className="bg-[#1a1a1a]">Selecione um serviço / produto</option>
                      {catalog.map(c => (
                        <option key={c.id} value={c.name} className="bg-[#1a1a1a]">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div className="w-full md:w-20 space-y-1">
                    <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleQtyChange(item.uuid, Number(e.target.value))}
                      className="w-full bg-transparent text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 text-center font-medium"
                      required
                    />
                  </div>

                  {/* Preço unitário */}
                  <div className="w-full md:w-32 space-y-1">
                    <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Preço Un (R$)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-[#E5E5E5]/50 text-sm">R$</span>
                      <input
                        type="number"
                        readOnly
                        value={displayPrice.toFixed(2)}
                        className={`w-full bg-transparent border-b border-[#D4AF37]/30 py-1 pl-9 pr-2 font-bold transition-colors duration-200 ${
                          item.usouCredito ? 'text-[#D4AF37]/50 line-through' : 'text-[#D4AF37]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Toggle de crédito */}
                  {assinaturaAtiva && (
                    <div className="w-full md:w-auto flex items-center">
                      <label
                        className={`flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-lg border transition-all duration-200 select-none ${
                          creditEnabled
                            ? 'cursor-pointer text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30 hover:bg-[#D4AF37]/20'
                            : 'cursor-not-allowed text-[#E5E5E5]/25 bg-transparent border-[#E5E5E5]/10'
                        }`}
                        title={!creditEnabled ? 'Sem créditos disponíveis para este serviço' : undefined}
                      >
                        <input
                          type="checkbox"
                          disabled={!creditEnabled}
                          checked={item.usouCredito}
                          onChange={e => handleCreditToggle(item.uuid, e.target.checked)}
                          className="w-3.5 h-3.5 accent-[#D4AF37] rounded"
                        />
                        {creditEnabled ? getCreditLabel(item) : 'Sem Crédito'}
                      </label>
                    </div>
                  )}

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.uuid)}
                    disabled={cartItems.length === 1}
                    className="mt-2 md:mt-0 p-2 text-[#E5E5E5]/40 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex mx-auto md:mx-0"
                    title="Remover item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Total e Submit ── */}
        <div className="border-t border-[#D4AF37]/20 pt-6 flex flex-col items-end gap-6">
          <div className="text-right">
            <p className="text-[#E5E5E5]/60 text-sm uppercase tracking-wider font-semibold mb-1">Total da Transação</p>
            <p className="text-4xl font-bold font-serif text-[#D4AF37]">{fmt.format(total)}</p>
            {cartItems.some(i => i.usouCredito) && (
              <p className="text-xs text-[#D4AF37]/60 mt-1 italic">
                Itens com crédito do plano não entram no total financeiro.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : 'Finalizar Transação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Transacoes;
