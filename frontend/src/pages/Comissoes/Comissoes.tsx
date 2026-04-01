import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, DollarSign, WalletCards } from 'lucide-react';
import { comissaoService } from '../../services/ComissaoService';
import { profissionalService } from '../../services/ProfissionalService';

export function Comissoes() {
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loadingProfissionais, setLoadingProfissionais] = useState(true);
  
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [relatorio, setRelatorio] = useState<any>(null);

  // Filtros
  const [profissionalId, setProfissionalId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const data = new Date();
    data.setDate(1); // Primeiro dia do mes
    return data.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const loadProfissionais = async () => {
      try {
        const data = await profissionalService.listar();
        setProfissionais(data);
      } catch (error) {
        console.error("Erro ao carregar profissionais", error);
      } finally {
        setLoadingProfissionais(false);
      }
    };
    loadProfissionais();
  }, []);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profissionalId) {
      alert("Selecione um profissional.");
      return;
    }

    setLoadingRelatorio(true);
    try {
      const data = await comissaoService.relatorio(Number(profissionalId), dataInicio, dataFim);
      setRelatorio(data);
    } catch (error) {
      console.error("Erro ao carregar relatório", error);
      alert("Erro ao gerar relatório de comissão.");
    } finally {
      setLoadingRelatorio(false);
    }
  };

  if (loadingProfissionais) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Relatório de Comissões</h1>
        <p className="text-[#E5E5E5]/60 mt-1">Gere extratos de repasses financeiros para os profissionais.</p>
      </header>

      {/* Bloco de Filtros */}
      <form onSubmit={handleBuscar} className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 p-6 md:p-8 shadow-lg space-y-6">
        <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
          <Calendar size={20} />
          Filtros de Período
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Profissional</label>
            <div className="relative">
              <select
                required
                value={profissionalId}
                onChange={e => setProfissionalId(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione um barbeiro</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#D4AF37]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">De:</label>
            <input
              type="date"
              required
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Até:</label>
            <input
              type="date"
              required
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={loadingRelatorio}
            className="px-8 py-3 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center"
          >
            {loadingRelatorio ? <Loader2 size={16} className="animate-spin" /> : 'Gerar Relatório'}
          </button>
        </div>
      </form>

      {/* Resultados do Relatório */}
      {relatorio && (
        <div className="animate-in slide-in-from-bottom flex flex-col gap-6">
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-6 shadow-[0_0_20px_rgba(212,175,55,0.05)] text-center">
             <h3 className="text-[#D4AF37] font-semibold text-lg">{relatorio.profissional}</h3>
             <p className="text-[#E5E5E5]/60 text-sm">Resumo da performance no período fornecido</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border-l-4 border-[#D4AF37] shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[#D4AF37]">
                <DollarSign size={80} />
              </div>
              <h3 className="text-[#E5E5E5]/70 text-sm font-medium uppercase tracking-wider mb-2">Total Vendido</h3>
              <p className="text-4xl font-bold text-[#E5E5E5]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(relatorio.totalMovimentado)}
              </p>
            </div>

            <div className="bg-[#121212] rounded-xl p-6 border-l-4 border-emerald-500 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                <WalletCards size={80} />
              </div>
              <h3 className="text-[#E5E5E5]/70 text-sm font-medium uppercase tracking-wider mb-2">Comissão Agregada (A Receber)</h3>
              <p className="text-4xl font-bold text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(relatorio.totalComissao)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}