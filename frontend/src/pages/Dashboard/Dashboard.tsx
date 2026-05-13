import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Scissors, DollarSign, Loader2 } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
import FluxoCaixaTab from './FluxoCaixaTab';
import VendasTab from './VendasTab';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'geral' | 'fluxo' | 'vendas'>('geral');

  useEffect(() => {
    if (activeTab !== 'geral') return;
    async function loadData() {
      try {
        setLoading(true);
        // Fix: generate local YYYY-MM-DD string without UTC offset issues
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const [resumo, transacoes, clientes] = await Promise.all([
          dashboardService.getResumoDiario(today),
          dashboardService.getTransacoes(),
          dashboardService.getClientes()
        ]);

        const totalFaturamento = resumo.movimentoDia.faturamentoTotal || 0;
        const totalTx = resumo.atendimentosRealizados || resumo.quantidadeTransacoes || 0;
        const ticketMedio = totalTx > 0 ? totalFaturamento / totalTx : 0;
        const clientesCount = clientes.length || 0;

        setMetrics([
          { id: 1, title: 'Faturamento do Dia', value: `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, icon: <TrendingUp size={24} />, trend: '' },
          { id: 2, title: 'Atendimentos Hoje', value: totalTx.toString(), icon: <Scissors size={24} />, trend: '' },
          { id: 3, title: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`, icon: <DollarSign size={24} />, trend: '' },
          { id: 4, title: 'Total de Clientes', value: clientesCount.toString(), icon: <Users size={24} />, trend: '' },
        ]);

        // Mapeia e pega apenas as 10 ultimas transacoes
        const ultimas = transacoes.slice(0, 10).map((tx: any) => ({
          id: tx.id,
          client: tx.cliente?.nome || 'Cliente Avulso',
          service: tx.itens && tx.itens.length > 0 ? tx.itens[0].item.nome + (tx.itens.length > 1 ? '...' : '') : 'Serviço',
          value: `R$ ${Number(tx.valorTotal).toFixed(2).replace('.', ',')}`,
          professional: tx.profissional?.nome || '-',
          time: new Date(tx.data).toLocaleTimeString('pt-BR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        }));

        setRecentTransactions(ultimas);

      } catch (error) {
        console.error("Erro ao carregar os dados do dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    if (activeTab === 'geral') {
      loadData();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)]">{ user?.nomeFantasia || 'Seja bem-vindo' }</h1>
        <p className="text-[#000000]/60 mt-1">Visão geral e relatórios financeiros do seu negócio.</p>
      </header>

      <div className="flex border-b border-[var(--color-primary)]/20 mb-6">
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors relative ${activeTab === 'geral' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]/80'}`}
          onClick={() => setActiveTab('geral')}
        >
          Visão Geral
          {activeTab === 'geral' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]"></span>}
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors relative ${activeTab === 'fluxo' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]/80'}`}
          onClick={() => setActiveTab('fluxo')}
        >
          Fluxo de Caixa
          {activeTab === 'fluxo' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]"></span>}
        </button>
        <button
          className={`py-3 px-6 font-semibold text-sm transition-colors relative ${activeTab === 'vendas' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-primary)]/80'}`}
          onClick={() => setActiveTab('vendas')}
        >
          Vendas de Produtos
          {activeTab === 'vendas' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-primary)]"></span>}
        </button>
      </div>

      {activeTab === 'geral' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-[var(--color-surface)] rounded-xl p-6 border-l-4 border-[var(--color-primary)] border-y border-r border-y-[var(--color-primary)]/10 border-r-[var(--color-primary)]/10 shadow-lg relative overflow-hidden group hover:border-y-[var(--color-primary)]/30 hover:border-r-[var(--color-primary)]/30 transition-colors"
          >
            {/* Efeito Glow subtil */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[var(--color-primary)]">
              {metric.icon}
            </div>

            <div className="relative z-10 w-12 h-12 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center text-[var(--color-primary)] mb-4">
              {metric.icon}
            </div>
            <h3 className="text-[var(--color-text)]/70 text-sm font-medium uppercase tracking-wider mb-1">{metric.title}</h3>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-[var(--color-text)]">{metric.value}</p>
              <span className="text-[var(--color-primary)] text-sm font-medium mb-1">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recents Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[var(--color-primary)]/20 flex justify-between items-center bg-[var(--color-surface)]">
          <h2 className="text-xl font-bold text-[var(--color-primary)]">Últimas Transações</h2>
          <button
            onClick={() => navigate('/transacoes', { state: { tab: 'historico' } })}
            className="text-sm text-[var(--color-text)]/70 hover:text-[var(--color-primary)] transition-colors uppercase tracking-wider font-semibold"
          >
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background)]">
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Cliente</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Serviço/Produto</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Profissional</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Data/Hora</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-primary)]/10">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[var(--color-primary)]/5 transition-colors group">
                  <td className="py-4 px-6 text-[var(--color-text)] font-medium">{tx.client}</td>
                  <td className="py-4 px-6 text-[var(--color-text)]/80 max-w-[200px] truncate" title={tx.service}>{tx.service}</td>
                  <td className="py-4 px-6 text-[var(--color-text)]/80">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-background)] border border-[var(--color-primary)]/30 text-[var(--color-primary)]">
                      {tx.professional}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[var(--color-text)]/60 text-sm">{tx.time}</td>
                  <td className="py-4 px-6 text-[var(--color-primary)] font-bold text-right">{tx.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {activeTab === 'fluxo' && <FluxoCaixaTab />}
      {activeTab === 'vendas' && <VendasTab />}
    </div>
  );
};

export default Dashboard;