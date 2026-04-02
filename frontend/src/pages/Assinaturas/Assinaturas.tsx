import React, { useState, useEffect } from 'react';
import { Crown, Package, Users, Plus, Edit2, Trash2, Loader2, Save, BarChart3, TrendingUp } from 'lucide-react';
import { assinaturaService } from '../../services/AssinaturaService';

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
  const [planoCortes, setPlanoCortes] = useState<number>(0);
  const [planoBarbas, setPlanoBarbas] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const p = await assinaturaService.getPlanos();
      const a = await assinaturaService.getAssinaturas();
      setPlanos(p);
      setAssinaturas(a);
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
        qtCortes: planoCortes,
        qtBarbas: planoBarbas
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
    setPlanoCortes(plano.qtCortes);
    setPlanoBarbas(plano.qtBarbas);
  };

  const resetForm = () => {
    setIsEditingPlano(false);
    setPlanoEditingId(null);
    setPlanoNome('');
    setPlanoValor('');
    setPlanoCortes(0);
    setPlanoBarbas(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] flex items-center gap-2">
            <Crown size={28} /> Clube de Assinaturas
          </h1>
          <p className="text-[#E5E5E5]/60 mt-1">Gerencie os planos e clientes mensalistas.</p>
        </div>
        {activeTab === 'planos' && !isEditingPlano && (
          <button 
            onClick={() => setIsEditingPlano(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Plano
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#D4AF37]/20">
        <button
          onClick={() => { setActiveTab('planos'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'planos' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#E5E5E5]/50 hover:text-[#E5E5E5]'}`}
        >
          <Package size={18} /> Planos Ativos
        </button>
        <button
          onClick={() => { setActiveTab('assinantes'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'assinantes' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#E5E5E5]/50 hover:text-[#E5E5E5]'}`}
        >
          <Users size={18} /> Assinantes
        </button>
        <button
          onClick={() => { setActiveTab('relatorios'); resetForm(); }}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'relatorios' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-[#E5E5E5]/50 hover:text-[#E5E5E5]'}`}
        >
          <BarChart3 size={18} /> Relatórios
        </button>
      </div>

      {activeTab === 'planos' && isEditingPlano && (
        <form onSubmit={handleCreateOrUpdatePlano} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[#E5E5E5] flex items-center gap-2">
            <Package className="text-[#D4AF37]" size={20} />
            {planoEditingId ? 'Editar Plano VIP' : 'Criar Novo Plano VIP'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Nome do Plano</label>
              <input
                type="text"
                required
                value={planoNome}
                onChange={e => setPlanoNome(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Ex: Plano Elite Prata"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Mensalidade (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={planoValor}
                onChange={e => setPlanoValor(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="79.90"
              />
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 border-t border-[#D4AF37]/20 pt-4 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Cortes Inclusos</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={planoCortes}
                  onChange={e => setPlanoCortes(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#121212] text-[#D4AF37] font-bold rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Barbas Inclusas</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={planoBarbas}
                  onChange={e => setPlanoBarbas(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#121212] text-[#D4AF37] font-bold rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-2 border-t border-[#D4AF37]/10">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 py-2 text-[#E5E5E5]/60 hover:text-[#E5E5E5] transition-colors uppercase text-sm font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loadingAction}
              className="px-8 py-2 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAction ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {planoEditingId ? 'Salvar Plano' : 'Ativar Plano'}
            </button>
          </div>
        </form>
      )}

      <div className={`bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 shadow-lg p-6 min-h-[400px] ${isEditingPlano && activeTab === 'planos' ? 'hidden' : 'block'}`}>
        {loading ? (
          <div className="text-center py-20 text-[#D4AF37] opacity-60 flex flex-col items-center justify-center h-full">
            <Crown size={48} className="animate-pulse mb-4" />
            <p>Carregando dados do clube...</p>
          </div>
        ) : activeTab === 'planos' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planos.length === 0 ? <p className="text-[#E5E5E5]/50 col-span-3 text-center py-10">Nenhum plano ativo no momento.</p> : null}
            {planos.map(plano => (
              <div key={plano.id} className="border border-[#D4AF37]/30 bg-[#121212] p-6 rounded-xl flex flex-col items-center text-center space-y-4 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all relative group overflow-hidden">
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => editPlano(plano)} className="p-1.5 bg-[#1a1a1a] border border-[#D4AF37]/30 text-[#D4AF37] rounded hover:bg-[#D4AF37]/20 transition" title="Editar plano">
                      <Edit2 size={14} />
                   </button>
                   <button onClick={() => handleDeletePlano(plano.id)} className="p-1.5 bg-[#1a1a1a] border border-red-500/30 text-red-500 rounded hover:bg-red-500/20 transition" title="Desativar plano">
                      <Trash2 size={14} />
                   </button>
                </div>
                <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider">{plano.nome}</h3>
                <div className="text-3xl font-serif text-[#D4AF37] font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plano.valorMensal)}
                </div>
                <div className="text-sm border-t border-[#D4AF37]/20 pt-4 w-full text-[#E5E5E5]/70 space-y-2">
                  {plano.qtCortes > 0 && <p className="flex justify-between"><span>Cortes Inclusos</span> <span className="text-[#D4AF37] font-bold">x{plano.qtCortes}</span></p>}
                  {plano.qtBarbas > 0 && <p className="flex justify-between"><span>Barbas Inclusas</span> <span className="text-[#D4AF37] font-bold">x{plano.qtBarbas}</span></p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#D4AF37]/20 text-[#E5E5E5]/50 text-xs uppercase tracking-wider">
                  <th className="pb-3 px-4">Cliente</th>
                  <th className="pb-3 px-4">Plano</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-center">Cortes Disp.</th>
                  <th className="pb-3 px-4 text-center">Barbas Disp.</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {assinaturas.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-[#E5E5E5]/50">Nenhum assinante ativo.</td></tr> : null}
                {assinaturas.map(ass => (
                  <tr key={ass.id} className="border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/5 transition-colors">
                    <td className="py-4 px-4 text-[#E5E5E5]">{ass.cliente?.nome}</td>
                    <td className="py-4 px-4 text-[#D4AF37]">{ass.plano?.nome}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest ${ass.status === 'ATIVA' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-red-500/20 text-red-500'}`}>
                        {ass.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#E5E5E5] text-center">{ass.creditosCorte}</td>
                    <td className="py-4 px-4 text-[#E5E5E5] text-center">{ass.creditosBarba}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border-l-4 border-[#D4AF37] shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[#D4AF37]">
                <Users size={80} />
              </div>
              <h3 className="text-[#E5E5E5]/70 text-sm font-medium uppercase tracking-wider mb-2">Assinantes Ativos</h3>
              <p className="text-4xl font-bold text-[#D4AF37]">
                {assinaturas.filter(a => a.status === 'ATIVA').length}
              </p>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-6 border-l-4 border-emerald-500 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                <TrendingUp size={80} />
              </div>
              <h3 className="text-[#E5E5E5]/70 text-sm font-medium uppercase tracking-wider mb-2">Receita Recorrente (MRR)</h3>
              <p className="text-4xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  assinaturas.filter(a => a.status === 'ATIVA').reduce((acc, curr) => acc + Number(curr.plano?.valorMensal || 0), 0)
                )}
              </p>
              <p className="text-xs text-[#E5E5E5]/40 mt-1 uppercase">Estimativa de ganhos mensais garantidos</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-[#D4AF37]/20 bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-[#D4AF37]">Popularidade dos Planos</h2>
            </div>
            <div className="p-6 space-y-4">
              {planos.map(plano => {
                const count = assinaturas.filter(a => a.status === 'ATIVA' && a.planoId === plano.id).length;
                return (
                  <div key={plano.id} className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-4 last:border-0 last:pb-0">
                    <div>
                      <h4 className="text-[#E5E5E5] font-bold text-lg">{plano.nome}</h4>
                      <p className="text-sm text-[#E5E5E5]/50">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plano.valorMensal))} / mês</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#D4AF37]">{count}</span>
                      <span className="text-[#E5E5E5]/50 ml-2 text-sm uppercase">ativos</span>
                    </div>
                  </div>
                )
              })}
              {planos.length === 0 && <p className="text-center text-[#E5E5E5]/50 py-4">Nenhum plano cadastrado.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assinaturas;
