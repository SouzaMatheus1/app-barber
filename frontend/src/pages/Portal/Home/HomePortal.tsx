import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';
import { api } from '../../../services/api';
import { LogOut, Calendar, Crown, Clock, CheckCircle2, X, Loader2, Sparkles, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Agendamento {
  id: number;
  dataHoraInicio: string;
  profissional: { id: number; nome: string };
  status: string;
  servicos: { item: { id: number; nome: string; duracaoMinutos: number } }[];
}

export default function HomePortal() {
  const { cliente, logout } = usePortalAuth();
  const navigate = useNavigate();

  const [assinatura, setAssinatura] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<{ futuros: Agendamento[], passados: Agendamento[], cancelados: Agendamento[] }>({ futuros: [], passados: [], cancelados: [] });
  const [loading, setLoading] = useState(true);

  // States de Agendamento
  const [showAgendar, setShowAgendar] = useState(false);
  const [profissionais, setProfissionais] = useState<{ id: number; nome: string }[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAssinatura, resAgendamentos, resProfissionais] = await Promise.all([
        api.get('/portal/minha-assinatura').catch(() => ({ data: null })),
        api.get('/portal/meus-agendamentos'),
        api.get('/profissionais')
      ]);

      setAssinatura(resAssinatura.data);
      setAgendamentos(resAgendamentos.data);
      setProfissionais(resProfissionais.data);
    } catch (error) {
      console.error("Erro carregando dados do portal", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/portal/login');
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfissional || !selectedDate || !selectedTime) return alert('Preencha os dados.');

    setIsSubmitting(true);
    const dataInicio = new Date(`${selectedDate}T${selectedTime}`);
    const dataFim = new Date(dataInicio.getTime() + 30 * 60000); // Padrao 30 min pro publico.

    try {
      await api.post('/portal/agendamentos', {
        profissionalId: Number(selectedProfissional),
        dataHoraInicio: dataInicio.toISOString(),
        dataHoraFim: dataFim.toISOString(),
        servicosIds: [], // Eles escolhem os serviços físicos na barbearia
        observacao: 'Agendado pelo App do Cliente'
      });
      alert('Horário reservado com sucesso!');
      setShowAgendar(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao agendar horário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-screen bg-[#0A0A0A] flex items-center justify-center text-[#D4AF37]"><Loader2 size={32} className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] pb-24">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#D4AF37]/20 p-6 sticky top-0 z-10 shadow-xl">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-[#E5E5E5]">Olá, {cliente?.nome.split(' ')[0]}</h1>
            <p className="text-sm text-[#D4AF37]">Bem-vindo à Barbearia X</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full bg-[#1A1A1A] text-[#E5E5E5]/50 hover:text-red-500 hover:bg-red-500/10 transition">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* Cartão de Assinatura VIP */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-bold text-[#E5E5E5]/50 uppercase tracking-widest mb-3">Seu Plano VIP</h2>
          
          {assinatura && assinatura.status === 'ATIVA' ? (
            <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#121212] border border-[#D4AF37]/40 rounded-2xl p-5 shadow-[0_4px_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
               <div className="absolute top-[-20px] right-[-20px] text-[#D4AF37]/10"><Crown size={120} /></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-1">
                   <Crown size={16} className="text-[#D4AF37]" />
                   <span className="text-[#D4AF37] font-bold text-lg">{assinatura.plano?.nome || 'Assinatura Padrão'}</span>
                 </div>
                 <p className="text-xs text-[#E5E5E5]/60 mb-4">Membro ativo. Aproveite suas vantagens!</p>
                 
                 <div className="space-y-2">
                   {assinatura.creditos?.map((cred: any) => (
                     <div key={cred.id} className="bg-[#0A0A0A]/50 rounded-lg p-3 flex justify-between items-center border border-[#D4AF37]/10">
                       <span className="text-sm font-medium">{cred.item?.nome}</span>
                       <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded text-xs font-bold">{cred.quantidadeRestante} disponíveis</span>
                     </div>
                   ))}
                   {(!assinatura.creditos || assinatura.creditos.length === 0) && (
                     <div className="text-xs text-[#E5E5E5]/40 italic">Uso ilimitado ativado.</div>
                   )}
                 </div>
               </div>
            </div>
          ) : (
            <div className="bg-[#121212] border border-[#E5E5E5]/10 rounded-2xl p-6 text-center">
               <div className="mx-auto w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-3">
                 <Sparkles className="text-[#E5E5E5]/40" size={20} />
               </div>
               <h3 className="text-[#E5E5E5] font-bold mb-1">Potencialize seu Visual</h3>
               <p className="text-[#E5E5E5]/50 text-xs mb-4">Assine o Clube na barbearia para ter cortes fixos mensais com desconto.</p>
            </div>
          )}
        </section>

        {/* Agendamentos */}
        <section className="animate-in slide-in-from-bottom-8 duration-700">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-sm font-bold text-[#E5E5E5]/50 uppercase tracking-widest">Próximos Horários</h2>
             <button onClick={() => setShowAgendar(true)} className="bg-[#D4AF37] text-[#0A0A0A] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
               <Calendar size={14} /> Agendar
             </button>
           </div>

           {agendamentos.futuros.length > 0 ? (
             <div className="space-y-3">
               {agendamentos.futuros.map(ag => (
                 <div key={ag.id} className="bg-[#1A1A1A] border-l-4 border-[#D4AF37] rounded-xl p-4 flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-[#121212] rounded-lg px-4 py-2 min-w-[70px]">
                      <span className="text-xs text-[#E5E5E5]/50 uppercase">{new Date(ag.dataHoraInicio).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="text-xl font-black text-[#D4AF37]">{new Date(ag.dataHoraInicio).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#E5E5E5]">Corte / Atendimento</h4>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#E5E5E5]/60">
                        <div className="flex items-center gap-1"><Clock size={12}/> {new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit'})}</div>
                        <div className="flex items-center gap-1"><User size={12}/> {ag.profissional.nome}</div>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center bg-[#121212] rounded-2xl py-8 border border-dashed border-[#D4AF37]/20">
               <Calendar className="mx-auto text-[#D4AF37]/30 mb-2" size={32}/>
               <p className="text-[#E5E5E5]/50 text-sm">Você não tem horários marcados.</p>
             </div>
           )}
        </section>

        {/* Histórico */}
        {agendamentos.passados.length > 0 && (
          <section className="animate-in slide-in-from-bottom-12 duration-700">
             <h2 className="text-sm font-bold text-[#E5E5E5]/50 uppercase tracking-widest mb-4">Histórico Recente</h2>
             <div className="space-y-3">
               {agendamentos.passados.slice(0, 3).map(ag => (
                 <div key={ag.id} className="bg-[#121212] border border-[#E5E5E5]/5 rounded-xl p-4 flex items-center justify-between opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle2 size={16}/></div>
                      <div>
                        <p className="text-sm font-bold">{new Date(ag.dataHoraInicio).toLocaleDateString('pt-BR')} às {new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit'})}</p>
                        <p className="text-xs text-[#E5E5E5]/40">{ag.profissional.nome}</p>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        )}

      </main>

      {/* MODAL DE AGENDAR */}
      {showAgendar && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#121212] w-full max-w-md sm:rounded-3xl rounded-t-3xl border-t sm:border border-[#D4AF37]/30 shadow-2xl p-6 pb-12 sm:pb-6 animate-in slide-in-from-bottom-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#D4AF37]">Reservar Horário</h2>
              <button onClick={() => setShowAgendar(false)} className="text-[#E5E5E5]/50"><X size={24}/></button>
            </div>

            <form onSubmit={handleAgendar} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/50 uppercase">Barbeiro</label>
                <select required value={selectedProfissional} onChange={e => setSelectedProfissional(e.target.value)} className="w-full mt-1 bg-[#1A1A1A] text-[#E5E5E5] border border-[#D4AF37]/30 rounded-xl px-4 py-3 outline-none">
                  <option value="">Selecione quem irá te atender</option>
                  {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#E5E5E5]/50 uppercase">Data</label>
                  <input required type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full mt-1 bg-[#1A1A1A] text-[#E5E5E5] border border-[#D4AF37]/30 rounded-xl px-4 py-3 outline-none min-w-[140px]" style={{ colorScheme: 'dark' }} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#E5E5E5]/50 uppercase">Hora</label>
                  <input required type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="w-full mt-1 bg-[#1A1A1A] text-[#E5E5E5] border border-[#D4AF37]/30 rounded-xl px-4 py-3 outline-none min-w-[120px]" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <p className="text-[10px] text-[#D4AF37]/60 italic text-center py-2">O tipo de corte será definido por você presencialmente.</p>

              <button disabled={isSubmitting} type="submit" className="w-full mt-4 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] hover:from-[#E5C158] hover:to-[#FFF0B3] text-[#0A0A0A] font-bold py-4 rounded-xl uppercase tracking-wider transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
