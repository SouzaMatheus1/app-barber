import React, { useState, useEffect } from 'react';
import { Loader2, PackageSearch, Tag } from 'lucide-react';
import { relatorioService } from '../../services/relatorioService';

const VendasTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any[]>([]);
  
  // Período padrão: Mês atual
  const date = new Date();
  const primeiroDia = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [dataInicial, setDataInicial] = useState(primeiroDia);
  const [dataFinal, setDataFinal] = useState(ultimoDia);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!dataInicial || !dataFinal) return;
    try {
      setLoading(true);
      const res = await relatorioService.getVendasProdutos(dataInicial, dataFinal);
      setDados(res);
    } catch (err) {
      console.error("Erro ao carregar relatório de vendas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const quantidadeTotal = dados.reduce((acc, curr) => acc + curr.quantidadeVendida, 0);
  const receitaTotal = dados.reduce((acc, curr) => acc + curr.receitaTotal, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Filtro de Período */}
      <form onSubmit={handleFiltrar} className="bg-[var(--color-surface)] p-4 rounded-xl shadow-sm border border-[var(--color-primary)]/10 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-semibold text-[var(--color-text)]/70 uppercase tracking-wider">Data Inicial</label>
          <input 
            type="date" 
            value={dataInicial} 
            onChange={(e) => setDataInicial(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
            required
          />
        </div>
        <div className="flex-1 space-y-1 w-full">
          <label className="text-xs font-semibold text-[var(--color-text)]/70 uppercase tracking-wider">Data Final</label>
          <input 
            type="date" 
            value={dataFinal} 
            onChange={(e) => setDataFinal(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="px-6 py-2 h-[42px] bg-[var(--color-primary)] text-black font-bold uppercase tracking-wider text-sm rounded hover:bg-[var(--color-secondary)] transition-colors w-full md:w-auto flex items-center justify-center">
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Filtrar'}
        </button>
      </form>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border-l-4 border-[var(--color-primary)] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[var(--color-primary)]"><PackageSearch size={48} /></div>
          <h3 className="text-[var(--color-text)]/70 text-sm font-medium uppercase tracking-wider mb-1">Itens Vendidos</h3>
          <p className="text-3xl font-bold text-[var(--color-text)]">{quantidadeTotal} unidades</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><Tag size={48} /></div>
          <h3 className="text-[var(--color-text)]/70 text-sm font-medium uppercase tracking-wider mb-1">Receita com Itens</h3>
          <p className="text-3xl font-bold text-emerald-500">R$ {receitaTotal.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[var(--color-primary)]/20">
          <h2 className="text-xl font-bold text-[var(--color-primary)]">Ranking de Serviços e Produtos</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-12 flex justify-center text-[var(--color-primary)]"><Loader2 className="animate-spin w-8 h-8" /></div>
          ) : dados.length === 0 ? (
             <div className="py-12 text-center text-[var(--color-text)]/50">Nenhuma venda registrada neste período.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)]">
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Item (Produto/Serviço)</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Tipo</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Qtd Vendida</th>
                  <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Receita Gerada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-primary)]/10">
                {dados.map((venda, index) => (
                  <tr key={index} className="hover:bg-[var(--color-primary)]/5 transition-colors group">
                    <td className="py-4 px-6 text-[var(--color-text)] font-medium">{venda.itemName}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-background)] border border-[var(--color-primary)]/30 text-[var(--color-primary)]">
                        {venda.tipoItem}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80 font-medium">{venda.quantidadeVendida} x</td>
                    <td className="py-4 px-6 text-[var(--color-primary)] font-bold text-right">R$ {venda.receitaTotal.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default VendasTab;
