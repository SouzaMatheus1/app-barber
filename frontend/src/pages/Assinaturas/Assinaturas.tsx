import React, { useState, useEffect } from 'react';
import { assinaturaService } from '../../services/AssinaturaService';
import { itemCatalogoService } from '../../services/ItemCatalogoService';
import { transacaoService } from '../../services/TransacaoService';
import { useAuth } from '../../contexts/AuthContext';
import { RotateCw, Calendar, Crown, Package, Users, Plus, Edit2, Trash2, Loader2, Save, BarChart3, TrendingUp } from 'lucide-react';

const Assinaturas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planos' | 'assinantes' | 'relatorios'>('planos');
  const [planos, setPlanos] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form State
  const [isEditingPlano, setIsEditingPlano] = useState(false);
  const [planoEditingId, setPlanoEditingId] = useState<number | null>(null);
  const [planoNome, setPlanoNome] = useState('');
  const [planoValor, setPlanoValor] = useState<number | ''>('');
  const [planoFrequencia, setPlanoFrequencia] = useState<'SEMANAL' | 'QUINZENAL' | 'MENSAL'>('MENSAL');
  const [itensPlanoSelected, setItensPlanoSelected] = useState<{ itemId: number, quantidade: number }[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const { user } = useAuth();

  // Modal State
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [modalClienteOpen, setModalClienteOpen] = useState<{nome: string, clienteId: number} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = await assinaturaService.getPlanos();
      const a = await assinaturaService.getAssinaturas();
      const c = await itemCatalogoService.listar();
      const t = await transacaoService.listar();
      setPlanos(p);
      setAssinaturas(a);
      setTransacoes(t);
      setCatalogo(c.filter((i: any) => i.tipo?.descricao === 'SERVICO'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdatePlano = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planoNome || planoValor === '') return;
    
    setLoadingAction(true);
    try {
      const payload = {
        nome: planoNome,
        valorMensal: Number(planoValor),
        frequencia: planoFrequencia,
        itens: itensPlanoSelected
      };

      if (planoEditingId) {
        await assinaturaService.editPlano(planoEditingId, payload);
      } else {
        await assinaturaService.createPlano(payload);
      }
      resetForm();
      const p = await assinaturaService.getPlanos();
      setPlanos(p);
    } catch (error) {
      console.error("Erro ao salvar plano", error);
      alert("Erro ao salvar o plano.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeletePlano = async (id: number) => {
    if (!window.confirm("Deseja realmente desativar este plano? Clientes que já o assinaram não perderão seus benefícios atuais, mas ele não será mais vendido.")) return;
    setLoadingAction(true);
    try {
      await assinaturaService.deletePlano(id);
      const p = await assinaturaService.getPlanos();
      setPlanos(p);
    } catch (error) {
      console.error("Erro ao desativar plano", error);
      alert("Erro ao desativar o plano.");
    } finally {
      setLoadingAction(false);
    }
  };

  const editPlano = (plano: any) => {
    setIsEditingPlano(true);
    setPlanoEditingId(Number(plano.id));
    setPlanoNome(plano.nome);
    setPlanoValor(Number(plano.valorMensal));
    setPlanoFrequencia(plano.frequencia || 'MENSAL');
    setItensPlanoSelected(plano.itens?.map((i: any) => ({
      itemId: i.itemId,
      quantidade: i.quantidade
    })) || []);
  };

  const resetForm = () => {
    setIsEditingPlano(false);
    setPlanoEditingId(null);
    setPlanoNome('');
    setPlanoValor('');
    setPlanoFrequencia('MENSAL');
    setItensPlanoSelected([]);
  };

  const addServiceToPlano = () => {
    setItensPlanoSelected([...itensPlanoSelected, { itemId: 0, quantidade: 1 }]);
  };

  const removeServiceFromPlano = (index: number) => {
    const newItens = [...itensPlanoSelected];
    newItens.splice(index, 1);
    setItensPlanoSelected(newItens);
  };

  const updateServiceInPlano = (index: number, field: 'itemId' | 'quantidade', value: number) => {
    const newItens = [...itensPlanoSelected];
    newItens[index] = { ...newItens[index], [field]: value };
    setItensPlanoSelected(newItens);
  };

  const handleRenovar = async (assinaturaId: number) => {
    if (!window.confirm("Deseja registrar o pagamento e renovar esta assinatura agora? Isso resetará os créditos do cliente e atualizará a data de vencimento.")) return;
    
    setLoadingAction(true);
    try {
        // Usa o ID do profissional logado ou o primeiro da lista como fallback
        const profId = user?.id || 1;
        await assinaturaService.renovar(assinaturaId, profId);
        await fetchData();
        alert("Assinatura renovada com sucesso!");
    } catch (error: any) {
        console.error("Erro ao renovar assinatura", error);
        alert("Erro ao renovar: " + (error.response?.data?.error || error.message));
    } finally {
        setLoadingAction(false);
    }
  };

  const getStatusColor = (vencimento: string | null) => {
    if (!vencimento) return 'text-[var(--color-text)]/40';
    const dataVenc = new Date(vencimento);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    dataVenc.setHours(0,0,0,0);

    if (dataVenc < hoje) return 'text-red-500 font-bold';
    if (dataVenc.getTime() === hoje.getTime()) return 'text-amber-500 font-bold';
    return 'text-emerald-500';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)] flex items-center gap-2">
            <Crown size={28} /> Clube de Assinaturas
          </h1>
          <p className="text-[var(--color-text)]/60 mt-1">Gerencie os planos e clientes mensalistas.</p>
        </div>
        {activeTab === 'planos' && !isEditingPlano && (
          <button 
            onClick={() => setIsEditingPlano(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Plano
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-primary)]/20">
        <button
          onClick={() => { setActiveTab('planos'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'planos' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          <Package size={18} /> Planos Ativos
        </button>
        <button
          onClick={() => { setActiveTab('assinantes'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'assinantes' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          <Users size={18} /> Assinantes
        </button>
        <button
          onClick={() => { setActiveTab('relatorios'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'relatorios' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          <BarChart3 size={18} /> Relatórios
        </button>
      </div>

      {activeTab === 'planos' && isEditingPlano && (
        <form onSubmit={handleCreateOrUpdatePlano} className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-primary)]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Package className="text-[var(--color-primary)]" size={20} />
            {planoEditingId ? 'Editar Plano VIP' : 'Criar Novo Plano VIP'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Nome do Plano</label>
              <input
                type="text"
                required
                value={planoNome}
                onChange={e => setPlanoNome(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Plano Prata"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Ciclo de Cobrança (Frequência)</label>
              <select
                value={planoFrequencia}
                onChange={e => setPlanoFrequencia(e.target.value as any)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="SEMANAL">Semanal</option>
                <option value="QUINZENAL">Quinzenal</option>
                <option value="MENSAL">Mensal</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Valor do Plano (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={planoValor}
                onChange={e => setPlanoValor(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="79.90"
              />
            </div>

            <div className="col-span-1 md:col-span-2 border-t border-[var(--color-primary)]/20 pt-4 mt-2 space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider">Serviços Inclusos no Plano</h3>
                  <button 
                    type="button"
                    onClick={addServiceToPlano}
                    className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/20 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Serviço
                  </button>
               </div>
               
               {itensPlanoSelected.length === 0 && (
                 <p className="text-xs text-[var(--color-text)]/40 italic py-2">Nenhum serviço selecionado.</p>
               )}

               <div className="space-y-3">
                 {itensPlanoSelected.map((item, index) => (
                   <div key={index} className="flex gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                     <div className="flex-1 space-y-2">
                       <label className="text-[10px] font-semibold text-[var(--color-text)]/60 uppercase tracking-widest">Serviço</label>
                       <select
                         required
                         value={item.itemId || ''}
                         onChange={(e) => updateServiceInPlano(index, 'itemId', Number(e.target.value))}
                         className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                       >
                         <option value="" disabled>Selecione</option>
                         {catalogo.map(c => (
                           <option key={c.id} value={c.id}>{c.nome}</option>
                         ))}
                       </select>
                     </div>
                     <div className="w-24 space-y-2">
                       <label className="text-[10px] font-semibold text-[var(--color-text)]/60 uppercase tracking-widest">Qtd.</label>
                       <input
                         type="number"
                         min="1"
                         required
                         value={item.quantidade}
                         onChange={(e) => updateServiceInPlano(index, 'quantidade', Number(e.target.value))}
                         className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-primary)] font-bold rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm text-center"
                       />
                     </div>
                     <button
                       type="button"
                       onClick={() => removeServiceFromPlano(index)}
                       className="p-2.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-2 border-t border-[var(--color-primary)]/10">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 py-2 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors uppercase text-sm font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loadingAction}
              className="px-8 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {planoEditingId ? 'Salvar Plano' : 'Ativar Plano'}
            </button>
          </div>
        </form>
      )}

      {activeTab !== 'relatorios' && (
        <div className={`bg-[var(--color-surface)] rounded-2xl border border-[var(--color-primary)]/20 shadow-lg p-6 min-h-[400px] ${isEditingPlano && activeTab === 'planos' ? 'hidden' : 'block'}`}>
          {loading ? (
            <div className="text-center py-20 text-[var(--color-primary)] opacity-60 flex flex-col items-center justify-center h-full">
              <Crown size={48} className="animate-pulse mb-4" />
              <p>Carregando dados do clube...</p>
            </div>
          ) : activeTab === 'planos' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planos.length === 0 ? <p className="text-[var(--color-text)]/50 col-span-3 text-center py-10">Nenhum plano ativo no momento.</p> : null}
              {planos.map(plano => (
                <div key={plano.id} className="border border-[var(--color-primary)]/30 bg-[var(--color-background)] p-6 rounded-xl flex flex-col items-center text-center space-y-4 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all relative group overflow-hidden">
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => editPlano(plano)} className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)]/20 transition" title="Editar plano">
                        <Edit2 size={14} />
                     </button>
                     <button onClick={() => handleDeletePlano(plano.id)} className="p-1.5 bg-[var(--color-surface)] border border-red-500/30 text-red-500 rounded hover:bg-red-500/20 transition" title="Desativar plano">
                        <Trash2 size={14} />
                     </button>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text)] uppercase tracking-wider">{plano.nome}</h3>
                  <div className="text-3xl font-serif text-[var(--color-primary)] font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valorMensal)}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[var(--color-text)]/40 font-bold">
                      Cobrança {plano.frequencia?.toLowerCase()}
                  </div>
                  <div className="text-sm border-t border-[var(--color-primary)]/20 pt-4 w-full text-[var(--color-text)]/70 space-y-2">
                    {plano.itens?.map((i: any) => (
                      <p key={i.id} className="flex justify-between">
                        <span>{i.item?.nome || 'Serviço'}</span> 
                        <span className="text-[var(--color-primary)] font-bold">x{i.quantidade}</span>
                      </p>
                    ))}
                    {(!plano.itens || plano.itens.length === 0) && <p className="text-xs text-[var(--color-text)]/40 italic">Sem serviços inclusos</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--color-primary)]/20 text-[var(--color-text)]/50 text-xs uppercase tracking-wider">
                    <th className="pb-3 px-4">Cliente</th>
                    <th className="pb-3 px-4">Plano / Ciclo</th>
                    <th className="pb-3 px-4 text-center">Status</th>
                    <th className="pb-3 px-4 text-center">Vencimento</th>
                    <th className="pb-3 px-4 text-right">Saldo de Créditos</th>
                    <th className="pb-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {assinaturas.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-[var(--color-text)]/50">Nenhum assinante ativo.</td></tr> : null}
                  {assinaturas.map(ass => (
                    <tr key={ass.id} className="border-b border-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/5 transition-colors">
                      <td className="py-4 px-4 text-[var(--color-text)]">{ass.cliente?.nome}</td>
                      <td className="py-4 px-4">
                          <div className="text-[var(--color-primary)] font-bold">{ass.plano?.nome}</div>
                          <div className="text-[10px] text-[var(--color-text)]/40 uppercase tracking-tighter">{ass.plano?.frequencia}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest ${ass.status === 'ATIVA' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-red-500/20 text-red-500'}`}>
                          {ass.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                          <div className={`text-sm ${getStatusColor(ass.dataProximoVencimento)} flex flex-col items-center gap-0.5`}>
                             <span className="flex items-center gap-1 font-sans">
                               <Calendar size={12} />
                               {ass.dataProximoVencimento ? new Date(ass.dataProximoVencimento).toLocaleDateString('pt-BR') : '-'}
                             </span>
                             {ass.dataProximoVencimento && new Date(ass.dataProximoVencimento) < new Date() && (
                               <span className="text-[9px] uppercase tracking-tighter bg-red-500 text-white px-1 rounded-xs">Vencido</span>
                             )}
                          </div>
                      </td>
                      <td className="py-4 px-4 text-[var(--color-text)] text-right">
                        <div className="flex flex-col gap-1 items-end">
                          {ass.creditos?.map((c: any) => (
                            <div key={c.id} className="text-xs">
                              <span className="text-[var(--color-text)]/60 mr-2">{c.item?.nome}:</span>
                              <span className={`${c.quantidadeRestante > 0 ? 'text-emerald-400' : 'text-red-400'} font-bold`}>{c.quantidadeRestante}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                          <button 
                              onClick={() => handleRenovar(ass.id)} 
                              className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                              title="Renovar agora (Registra pagamento)"
                          >
                              <RotateCw size={14} className={loadingAction ? 'animate-spin' : ''} />
                          </button>
                          <button 
                              onClick={() => setModalClienteOpen({nome: ass.cliente?.nome, clienteId: ass.clienteId})} 
                              className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 rounded hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/20 font-bold uppercase tracking-wider"
                          >
                              Histórico
                          </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface)] rounded-xl p-6 border-l-4 border-[var(--color-primary)] shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[var(--color-primary)]">
                <Users size={80} />
              </div>
              <h3 className="text-[var(--color-text)]/70 text-sm font-medium uppercase tracking-wider mb-2">Assinantes Ativos</h3>
              <p className="text-4xl font-bold text-[var(--color-primary)]">
                {assinaturas.filter(a => a.status === 'ATIVA').length}
              </p>
            </div>
            
            <div className="bg-[var(--color-surface)] rounded-xl p-6 border-l-4 border-emerald-500 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                <TrendingUp size={80} />
              </div>
              <h3 className="text-[var(--color-text)]/70 text-sm font-medium uppercase tracking-wider mb-2">Receita Recorrente (MRR)</h3>
              <p className="text-4xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  assinaturas.filter(a => a.status === 'ATIVA').reduce((acc, curr) => acc + Number(curr.plano?.valorMensal || 0), 0)
                )}
              </p>
              <p className="text-xs text-[var(--color-text)]/40 mt-1 uppercase">Estimativa de ganhos mensais garantidos</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-[var(--color-primary)]/20 bg-[var(--color-surface)]">
              <h2 className="text-xl font-bold text-[var(--color-primary)]">Popularidade dos Planos</h2>
            </div>
            <div className="p-6 space-y-4">
              {planos.map(plano => {
                const count = assinaturas.filter(a => a.status === 'ATIVA' && a.planoId === plano.id).length;
                return (
                  <div key={plano.id} className="flex justify-between items-center border-b border-[var(--color-primary)]/10 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="text-[var(--color-text)] font-bold text-lg">{plano.nome}</h4>
                      <p className="text-sm text-[var(--color-text)]/50">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plano.valorMensal))} / mês</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[var(--color-primary)]">{count}</span>
                      <span className="text-[var(--color-text)]/50 ml-2 text-sm uppercase">ativos</span>
                    </div>
                  </div>
                )
              })}
              {planos.length === 0 && <p className="text-center text-[var(--color-text)]/50 py-4">Nenhum plano cadastrado.</p>}
            </div>
          </div>
        </div>
      )}
      {modalClienteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--color-surface)] rounded-xl p-6 w-full max-w-2xl border border-[var(--color-primary)]/30 shadow-2xl relative max-h-[80vh] flex flex-col">
              <h2 className="text-xl font-bold text-[var(--color-primary)] mb-2">{modalClienteOpen.nome}</h2>
              <p className="text-xs text-[var(--color-text)]/50 uppercase tracking-widest mb-4 border-b border-[var(--color-primary)]/20 pb-4">Histórico de Transações</p>

              <div className="overflow-y-auto flex-1 pr-2">
                 {transacoes.filter(t => t.clienteId === modalClienteOpen.clienteId).length === 0 ? (
                    <p className="text-center text-[var(--color-text)]/50 py-8">Nenhuma transação registrada para este assinante.</p>
                 ) : (
                    <div className="space-y-3">
                       {transacoes.filter(t => t.clienteId === modalClienteOpen.clienteId).map(t => (
                          <div key={t.id} className="bg-[var(--color-background)] p-4 rounded-lg border border-[var(--color-primary)]/10 flex justify-between items-center">
                             <div>
                                <p className="font-bold text-[var(--color-text)] text-sm">{new Date(t.data).toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-[var(--color-text)]/60 mt-1">{t.descricao || 'Atendimento'}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[var(--color-primary)] font-bold">R$ {Number(t.valorTotal).toFixed(2)}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-primary)]/20 flex justify-end">
                 <button onClick={() => setModalClienteOpen(null)} className="px-6 py-2 bg-[var(--color-background)] border border-[var(--color-primary)]/30 text-[var(--color-text)] rounded hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors uppercase text-xs font-bold font-sans">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Assinaturas;
