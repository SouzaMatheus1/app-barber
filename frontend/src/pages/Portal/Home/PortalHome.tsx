import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';
import { api } from '../../../services/api';
import { Calendar, Clock, Power, Sparkles, Scissors } from 'lucide-react';

interface Servico {
  item: {
    id: number;
    nome: string;
    preco: number;
  };
}

interface Agendamento {
  id: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'NO_SHOW' | 'INDISPONIVEL';
  observacao?: string;
  profissional: {
    nome: string;
  };
  servicos: Servico[];
}

interface Empresa {
  id: number;
  nomeFantasia: string;
  slug: string;
}

interface Credito {
  id: number;
  itemId: number;
  quantidadeRestante: number;
  item: {
    nome: string;
  };
}

interface AssinaturaAtiva {
  id: number;
  plano: {
    nome: string;
    itens: {
      itemId: number;
      quantidade: number;
    }[];
  };
  dataProximoVencimento: string;
  creditos: Credito[];
}

export default function PortalHome() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cliente, logout } = usePortalAuth();
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [assinatura, setAssinatura] = useState<AssinaturaAtiva | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortalData();
  }, [slug]);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [resEmpresa, resAgendamentos, resAssinatura] = await Promise.all([
        api.get(`/portal/${slug}/empresa`),
        api.get('/agendamentos'),
        api.get('/portal/minha-assinatura').catch(err => {
          console.log("Sem assinatura ativa:", err);
          return { data: null };
        })
      ]);
      setEmpresa(resEmpresa.data);
      setAgendamentos(resAgendamentos.data);
      setAssinatura(resAssinatura.data);
    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    try {
      await api.put(`/agendamentos/${id}/status`, { status: 'CANCELADO' });
      alert('Agendamento cancelado com sucesso.');
      loadPortalData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao cancelar agendamento.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate(`/portal/${slug}/login`);
  };

  // Separa próximos de passados
  const now = new Date();
  const proximos = agendamentos.filter(a => 
    new Date(a.dataHoraInicio) >= now && 
    (a.status === 'CONFIRMADO' || a.status === 'EM_ANDAMENTO')
  );
  
  const historico = agendamentos.filter(a => 
    new Date(a.dataHoraInicio) < now || 
    (a.status !== 'CONFIRMADO' && a.status !== 'EM_ANDAMENTO')
  );

  const formatarData = (dataIso: string) => {
    const d = new Date(dataIso);
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  };

  const formatarHora = (dataIso: string) => {
    const d = new Date(dataIso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarDataSimples = (dataIso: string) => {
    if (!dataIso) return 'N/A';
    const d = new Date(dataIso);
    return d.toLocaleDateString('pt-BR');
  };

  const getValorTotal = (servicos: Servico[]) => {
    return servicos.reduce((acc, s) => acc + Number(s.item.preco), 0);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-24 relative overflow-x-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Fixo/Topo */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-primary)]/10 px-6 py-4 flex justify-between items-center max-w-2xl md:max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-[0_0_15px_var(--color-primary)]/30">
            <Sparkles className="text-[var(--color-background)] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-md font-serif font-bold text-[var(--color-primary)] tracking-wide uppercase">
              {empresa?.nomeFantasia || 'Carregando...'}
            </h1>
            <p className="text-[10px] text-[var(--color-text)]/40 tracking-widest uppercase">Agendamentos</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2.5 rounded-xl hover:bg-red-500/10 text-[var(--color-text)]/60 hover:text-red-400 transition-all flex items-center justify-center border border-transparent hover:border-red-500/20"
          title="Sair do Portal"
        >
          <Power size={18} />
        </button>
      </header>

      <main className="max-w-md md:max-w-6xl mx-auto px-6 mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Coluna 1: Novo Agendamento & Assinatura */}
          <div className="space-y-8">
            {/* Banner de Boas-vindas */}
            <div className="bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-2)] border border-[var(--color-primary)]/15 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-2xl pointer-events-none" />
              <p className="text-xs text-[var(--color-primary)] font-bold tracking-widest uppercase mb-1">Bem-vindo(a)</p>
              <h2 className="text-2xl font-bold font-serif mb-4 text-[var(--color-text)]">{cliente?.nome?.split(' ')[0] || 'Cliente VIP'}</h2>
              <p className="text-sm text-[var(--color-text)]/60 mb-6">Agende e gerencie seus compromissos com poucos cliques de forma rápida.</p>
              
              <button 
                onClick={() => navigate(`/portal/${slug}/agendar`)}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_20px_var(--color-primary)]/20 hover:shadow-[0_4px_25px_var(--color-primary)]/40 hover:scale-[1.01]"
              >
                <Scissors size={20} /> Agendar Agora
              </button>
            </div>

            {/* Minha Assinatura / Créditos */}
            {assinatura && (
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-[var(--color-text)]/40 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--color-primary)]" /> Minha Assinatura
                </h3>
                <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-primary)]/15 rounded-2xl p-5 shadow-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)]">{assinatura.plano.nome}</h4>
                      <p className="text-[10px] text-[var(--color-text)]/40 uppercase tracking-wider">Assinatura Ativa</p>
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Ativa
                    </span>
                  </div>

                  <div className="border-t border-[var(--color-primary)]/5 pt-3 space-y-3">
                    <span className="text-[10px] text-[var(--color-text)]/40 font-bold uppercase tracking-widest block">Consumo de Créditos</span>
                    <div className="space-y-3">
                      {assinatura.creditos.map(c => {
                        const itemPlano = assinatura.plano.itens?.find(pi => pi.itemId === c.itemId);
                        const inicial = itemPlano ? itemPlano.quantidade : 0;
                        const usados = Math.max(0, inicial - c.quantidadeRestante);
                        const percentualDisponivel = inicial > 0 ? (c.quantidadeRestante / inicial) * 100 : 0;

                        return (
                          <div key={c.id} className="space-y-1.5 pb-2 border-b border-[var(--color-primary)]/5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[var(--color-text)]/70 font-medium">{c.item.nome}</span>
                              <span className="text-[10px] text-[var(--color-text)]/40 font-bold">
                                {c.quantidadeRestante} de {inicial} restantes
                              </span>
                            </div>
                            
                            {/* Barra de Progresso */}
                            <div className="w-full h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-500" 
                                style={{ width: `${percentualDisponivel}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[9px] text-[var(--color-text)]/40">
                              <span>Usados: {usados}</span>
                              <span>Disponíveis: {c.quantidadeRestante}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-primary)]/5 pt-3 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-[var(--color-text)]/40 font-bold uppercase tracking-widest">Vencimento</span>
                    <strong className="text-[var(--color-text)]/80 font-medium">
                      {formatarDataSimples(assinatura.dataProximoVencimento)}
                    </strong>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Coluna 2: Próximos Agendamentos */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-[var(--color-text)]/40 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-[var(--color-primary)]" /> Próximos Agendamentos
            </h3>

            {loading ? (
              <div className="py-10 text-center text-sm text-[var(--color-primary)]/50 animate-pulse">Buscando seus horários...</div>
            ) : proximos.length === 0 ? (
              <div className="bg-[var(--color-surface)]/40 border border-dashed border-[var(--color-primary)]/10 rounded-2xl p-8 text-center">
                <p className="text-sm text-[var(--color-text)]/40">Nenhum agendamento ativo.</p>
                <button 
                  onClick={() => navigate(`/portal/${slug}/agendar`)}
                  className="mt-3 text-xs text-[var(--color-primary)] font-bold hover:underline"
                >
                  Clique aqui para reservar seu horário
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {proximos.map(ag => (
                  <div key={ag.id} className="bg-[var(--color-surface)] border border-[var(--color-primary)]/15 rounded-2xl p-5 shadow-md flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {ag.status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Confirmado'}
                        </span>
                        <h4 className="text-lg font-bold mt-2 text-[var(--color-text)] capitalize">
                          {formatarData(ag.dataHoraInicio)}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] mt-1 font-semibold">
                          <Clock size={14} /> {formatarHora(ag.dataHoraInicio)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--color-primary)]/5 pt-3 space-y-2">
                      <p className="text-xs text-[var(--color-text)]/50">
                        Profissional: <strong className="text-[var(--color-text)]/80">{ag.profissional.nome}</strong>
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ag.servicos.map((s, idx) => (
                          <span key={idx} className="text-[10px] bg-[var(--color-background)] border border-[var(--color-primary)]/10 px-2 py-1 rounded text-[var(--color-text)]/70">
                            {s.item.nome}
                          </span>
                        ))}
                      </div>
                      {ag.servicos.length > 0 && (
                        <p className="text-xs font-bold text-[var(--color-primary)] mt-2">
                          Total: R$ {getValorTotal(ag.servicos).toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>

                    <button 
                      onClick={() => handleCancelAppointment(ag.id)}
                      className="w-full mt-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                    >
                      Desistir / Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Coluna 3: Histórico de Atendimentos */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-[var(--color-text)]/40 uppercase tracking-widest">Histórico de Atendimentos</h3>

            {loading ? (
              <div className="h-10 animate-pulse bg-[var(--color-surface)]/20 rounded-xl" />
            ) : historico.length === 0 ? (
              <p className="text-xs text-[var(--color-text)]/30 text-center py-4">Nenhum atendimento anterior registrado.</p>
            ) : (
              <div className="space-y-3">
                {historico.map(ag => {
                  const isConcluido = ag.status === 'CONCLUIDO';
                  const isCancelado = ag.status === 'CANCELADO';
                  const isNoShow = ag.status === 'NO_SHOW';
                  
                  return (
                    <div key={ag.id} className="bg-[var(--color-surface)]/60 border border-[var(--color-primary)]/5 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-[var(--color-text)]/50 capitalize font-medium">
                          {new Date(ag.dataHoraInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {formatarHora(ag.dataHoraInicio)}
                        </p>
                        <h4 className="text-sm font-bold text-[var(--color-text)] mt-1">
                          {ag.servicos.map(s => s.item.nome).join(', ') || 'Atendimento'}
                        </h4>
                        <p className="text-[10px] text-[var(--color-text)]/40 mt-0.5 truncate max-w-[200px]">
                          Profissional: {ag.profissional.nome}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {isConcluido && (
                          <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Realizado
                          </span>
                        )}
                        {isCancelado && (
                          <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Cancelado
                          </span>
                        )}
                        {isNoShow && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Faltou
                          </span>
                        )}
                        {ag.servicos.length > 0 && (
                          <span className="text-xs font-semibold text-[var(--color-text)]/60">
                            R$ {getValorTotal(ag.servicos).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
