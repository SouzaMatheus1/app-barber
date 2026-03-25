import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Scissors, DollarSign, Loader2 } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Chama resumo diario usando a data de hoje para o parametro
        const today = new Date().toISOString().split('T')[0];
        const [resumo, transacoes, clientes] = await Promise.all([
          dashboardService.getResumoDiario(today),
          dashboardService.getTransacoes(),
          dashboardService.getClientes()
        ]);

        const totalFaturamento = resumo.movimentoDia.faturamentoTotal || 0;
        const totalTx = resumo.quantidadeTransacoes || 0;
        const ticketMedio = totalTx > 0 ? totalFaturamento / totalTx : 0;
        const clientesCount = clientes.length || 0;

        setMetrics([
          { id: 1, title: 'Faturamento do Dia', value: `R$ ${totalFaturamento.toFixed(2).replace('.', ',')}`, icon: <TrendingUp size={24} />, trend: '' },
          { id: 2, title: 'Cortes Realizados', value: totalTx.toString(), icon: <Scissors size={24} />, trend: '' },
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
          time: new Date(tx.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));

        setRecentTransactions(ultimas);

      } catch (error) {
        console.error("Erro ao carregar os dados do dashboard", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">WS Barber Shop</h1>
        <p className="text-[#000000]/60 mt-1">Resumo das atividades métricas de hoje.</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className="bg-[#1a1a1a] rounded-xl p-6 border-l-4 border-[#D4AF37] border-y border-r border-y-[#D4AF37]/10 border-r-[#D4AF37]/10 shadow-lg relative overflow-hidden group hover:border-y-[#D4AF37]/30 hover:border-r-[#D4AF37]/30 transition-colors"
          >
            {/* Efeito Glow subtil */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-[#D4AF37]">
              {metric.icon}
            </div>
            
            <div className="relative z-10 w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] mb-4">
              {metric.icon}
            </div>
            <h3 className="text-[#E5E5E5]/70 text-sm font-medium uppercase tracking-wider mb-1">{metric.title}</h3>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-[#E5E5E5]">{metric.value}</p>
              <span className="text-[#D4AF37] text-sm font-medium mb-1">{metric.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recents Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[#D4AF37]/20 flex justify-between items-center bg-[#1a1a1a]">
          <h2 className="text-xl font-bold text-[#D4AF37]">Últimas Transações</h2>
          <button className="text-sm text-[#E5E5E5]/70 hover:text-[#D4AF37] transition-colors uppercase tracking-wider font-semibold">
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121212]">
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Cliente</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Serviço/Produto</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Profissional</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Hora</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#D4AF37]/5 transition-colors group">
                  <td className="py-4 px-6 text-[#E5E5E5] font-medium">{tx.client}</td>
                  <td className="py-4 px-6 text-[#E5E5E5]/80">{tx.service}</td>
                  <td className="py-4 px-6 text-[#E5E5E5]/80">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#121212] border border-[#D4AF37]/30 text-[#D4AF37]">
                      {tx.professional}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#E5E5E5]/60 text-sm">{tx.time}</td>
                  <td className="py-4 px-6 text-[#D4AF37] font-bold text-right">{tx.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;