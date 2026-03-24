import React from 'react';
import { TrendingUp, Users, Scissors, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Dados simulados para o visual
  const metrics = [
    { id: 1, title: 'Faturamento do Dia', value: 'R$ 1.250,00', icon: <TrendingUp size={24} />, trend: '+15%' },
    { id: 2, title: 'Cortes Realizados', value: '28', icon: <Scissors size={24} />, trend: '+5' },
    { id: 3, title: 'Ticket Médio', value: 'R$ 44,60', icon: <DollarSign size={24} />, trend: '+R$ 2,00' },
    { id: 4, title: 'Novos Clientes', value: '4', icon: <Users size={24} />, trend: '+2' },
  ];

  const recentTransactions = [
    { id: 101, client: 'João Silva', service: 'Corte + Barba', value: 'R$ 80,00', professional: 'Marcos', time: '14:30' },
    { id: 102, client: 'Pedro Santos', service: 'Corte Degradê', value: 'R$ 45,00', professional: 'Lucas', time: '15:00' },
    { id: 103, client: 'Carlos Oliveira', service: 'Barba Terapia', value: 'R$ 35,00', professional: 'Marcos', time: '15:45' },
    { id: 104, client: 'Cliente Avulso', service: 'Pomada Modeladora', value: 'R$ 60,00', professional: 'Recepção', time: '16:10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Dashboard</h1>
        <p className="text-[#E5E5E5]/60 mt-1">Resumo das atividades métricas de hoje.</p>
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