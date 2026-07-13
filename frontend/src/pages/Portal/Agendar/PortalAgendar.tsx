import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { User, Calendar, Clock, ChevronRight, ChevronLeft, Check, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';

interface Servico {
  id: number;
  nome: string;
  preco: number;
  duracaoMinutos?: number;
  tipo: {
    descricao: string;
  };
}

interface Profissional {
  id: number;
  nome: string;
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
  };
  creditos: Credito[];
}

export default function PortalAgendar() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cliente } = usePortalAuth();

  // Ativos do cliente
  const [ativos, setAtivos] = useState<any[]>([]);
  const [selectedAtivoId, setSelectedAtivoId] = useState<number | ''>('');
  const [tipoEmpresa, setTipoEmpresa] = useState<string>('');

  // Wizard Steps: 'SERVICOS' -> 'PROFISSIONAL' -> 'DATA_HORA' -> 'CONFIRMAR'
  const [step, setStep] = useState<'SERVICOS' | 'PROFISSIONAL' | 'DATA_HORA' | 'CONFIRMAR'>('SERVICOS');

  // API Data
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [slotsDisponiveis, setSlotsDisponiveis] = useState<string[]>([]);
  const [assinatura, setAssinatura] = useState<AssinaturaAtiva | null>(null);
  const [usarCreditos, setUsarCreditos] = useState<boolean>(false);
  
  // Loading States
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProfissionais, setLoadingProfissionais] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selections
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  
  // Success state
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (selectedProfissional && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedProfissional, selectedDate, selectedServices]);

  // Efeito para ativar/desativar o uso de créditos automaticamente
  useEffect(() => {
    if (checkCreditosDisponiveis()) {
      setUsarCreditos(true);
    } else {
      setUsarCreditos(false);
    }
  }, [selectedServices, assinatura]);

  useEffect(() => {
    async function loadAtivos() {
      if (cliente?.id && tipoEmpresa && tipoEmpresa.toLowerCase() !== 'barbearia') {
        try {
          const res = await api.get(`/clientes/${cliente.id}/ativos`);
          const clientAtivos = res.data;
          setAtivos(clientAtivos);
          if (clientAtivos.length === 1) {
            setSelectedAtivoId(clientAtivos[0].id);
          } else {
            setSelectedAtivoId('');
          }
        } catch (error) {
          console.error("Erro ao carregar ativos do portal:", error);
        }
      }
    }
    loadAtivos();
  }, [cliente?.id, tipoEmpresa]);

  const checkCreditosDisponiveis = () => {
    if (!assinatura || selectedServices.length === 0) return false;
    
    const contagemServicos: Record<number, number> = {};
    for (const s of selectedServices) {
      contagemServicos[s.id] = (contagemServicos[s.id] || 0) + 1;
    }

    for (const [itemIdStr, qtdNecessaria] of Object.entries(contagemServicos)) {
      const itemId = Number(itemIdStr);
      const credito = assinatura.creditos.find(c => c.itemId === itemId);
      if (!credito || credito.quantidadeRestante < qtdNecessaria) {
        return false;
      }
    }
    return true;
  };

  const loadBaseData = async () => {
    try {
      setLoadingServices(true);
      setLoadingProfissionais(true);

      const [resCat, resProf, resAssinatura, resEmpresa] = await Promise.all([
        api.get('/itens'),
        api.get('/profissionais'),
        api.get('/portal/minha-assinatura').catch(err => {
          console.log("Sem assinatura ativa:", err);
          return { data: null };
        }),
        api.get(`/portal/${slug}/empresa`).catch(err => {
          console.log("Erro ao carregar empresa:", err);
          return { data: null };
        })
      ]);

      // Filtrar apenas itens que são SERVICO
      const apenasServicos = resCat.data.filter((item: any) => item.tipo?.descricao === 'SERVICO');
      setServicos(apenasServicos);
      setProfissionais(resProf.data);
      if (resAssinatura.data) {
        setAssinatura(resAssinatura.data);
      }
      if (resEmpresa.data?.tipo?.descricao) {
        setTipoEmpresa(resEmpresa.data.tipo.descricao);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de agendamento:', error);
    } finally {
      setLoadingServices(false);
      setLoadingProfissionais(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedProfissional) return;
    
    try {
      setLoadingSlots(true);
      setSelectedTime(''); // Limpa horário selecionado anteriormente
      
      const totalDuracao = getDuracaoTotal();
      
      const res = await api.get('/agendamentos/disponibilidade', {
        params: {
          profissionalId: selectedProfissional.id,
          data: selectedDate,
          duracaoMinutos: totalDuracao
        }
      });
      
      setSlotsDisponiveis(res.data);
    } catch (error) {
      console.error('Erro ao buscar slots disponíveis:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleToggleService = (servico: Servico) => {
    const exists = selectedServices.some(s => s.id === servico.id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.id !== servico.id));
    } else {
      setSelectedServices([...selectedServices, servico]);
    }
  };

  const getDuracaoTotal = () => {
    // Se o serviço não tiver duracaoMinutos, assume 30 minutos por padrão
    return selectedServices.reduce((acc, s) => acc + (s.duracaoMinutos || 30), 0);
  };

  const getValorTotal = () => {
    return selectedServices.reduce((acc, s) => acc + Number(s.preco), 0);
  };

  const handleConfirmAgendamento = async () => {
    if (!selectedProfissional || selectedServices.length === 0 || !selectedDate || !selectedTime) return;

    try {
      setSubmitting(true);

      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const duracaoTotal = getDuracaoTotal();
      const endDateTime = new Date(startDateTime.getTime() + duracaoTotal * 60 * 1000);

      await api.post('/agendamentos', {
        profissionalId: selectedProfissional.id,
        servicosIds: selectedServices.map(s => s.id),
        dataHoraInicio: startDateTime.toISOString(),
        dataHoraFim: endDateTime.toISOString(),
        observacao: observacao || 'Agendado via Portal do Cliente',
        usarCreditos,
        ativoId: selectedAtivoId !== '' ? selectedAtivoId : undefined
      });

      setSuccess(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao realizar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatarData = (dataStr: string) => {
    const parts = dataStr.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getStepProgress = () => {
    switch (step) {
      case 'SERVICOS': return 25;
      case 'PROFISSIONAL': return 50;
      case 'DATA_HORA': return 75;
      case 'CONFIRMAR': return 100;
    }
  };

  // Se já agendou com sucesso, exibe a tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)] mb-2">
            <Check size={40} className="stroke-[2.5]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-serif font-bold text-green-400">Agendado!</h1>
            <p className="text-sm text-[var(--color-text)]/60">
              Seu horário foi reservado com sucesso e já está confirmado.
            </p>
          </div>

          {/* Card Resumo Rápido */}
          <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-primary)]/10 rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-primary)] font-bold tracking-widest uppercase">Data e Hora</span>
              <p className="text-md font-bold capitalize">{formatarData(selectedDate)}</p>
              <p className="text-sm text-[var(--color-primary)] font-bold">{selectedTime}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text)]/40 font-bold tracking-widest uppercase">Profissional</span>
              <p className="text-sm font-semibold">{selectedProfissional?.nome}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[var(--color-text)]/40 font-bold tracking-widest uppercase">Serviços</span>
              <p className="text-xs text-[var(--color-text)]/70">{selectedServices.map(s => s.nome).join(', ')}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate(`/${slug}/home`)}
            className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl transition-all shadow-[0_4px_20px_var(--color-primary)]/20 uppercase tracking-widest text-xs"
          >
            Voltar para a Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] pb-24 relative">
      
      {/* Barra de Progresso Fina */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-surface)] z-50">
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] transition-all duration-300 shadow-[0_0_10px_var(--color-primary)]" 
          style={{ width: `${getStepProgress()}%` }}
        />
      </div>

      {/* Header Fixo/Topo */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-primary)]/10 px-6 py-4 flex items-center max-w-2xl mx-auto w-full">
        <button 
          onClick={() => {
            if (step === 'SERVICOS') navigate(`/${slug}/home`);
            else if (step === 'PROFISSIONAL') setStep('SERVICOS');
            else if (step === 'DATA_HORA') setStep('PROFISSIONAL');
            else if (step === 'CONFIRMAR') setStep('DATA_HORA');
          }}
          className="p-2 -ml-2 rounded-xl text-[var(--color-text)]/60 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-all"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-sm font-semibold tracking-wider uppercase ml-2 text-[var(--color-text)]/80">
          {step === 'SERVICOS' && 'Escolha os Serviços'}
          {step === 'PROFISSIONAL' && 'Escolha o Barbeiro'}
          {step === 'DATA_HORA' && 'Escolha a Data e Hora'}
          {step === 'CONFIRMAR' && 'Resumo do Agendamento'}
        </span>
      </header>

      <main className="max-w-md mx-auto px-6 mt-6 relative z-10">

        {/* STEP 1: SERVIÇOS */}
        {step === 'SERVICOS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-[var(--color-primary)]">O que vamos fazer hoje?</h2>
              <p className="text-xs text-[var(--color-text)]/60">Selecione um ou mais serviços do catálogo abaixo.</p>
            </div>

            {loadingServices ? (
              <div className="py-16 text-center text-sm text-[var(--color-primary)]/50 animate-pulse">Carregando catálogo...</div>
            ) : servicos.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--color-text)]/40 italic">Nenhum serviço disponível no momento.</div>
            ) : (
              <div className="space-y-3">
                {servicos.map(s => {
                  const isSelected = selectedServices.some(item => item.id === s.id);
                  return (
                    <div 
                      key={s.id}
                      onClick={() => handleToggleService(s)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        isSelected 
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50 shadow-[0_0_15px_var(--color-primary)]/10' 
                          : 'bg-[var(--color-surface)]/60 border-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/20'
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <h4 className="font-bold text-sm text-[var(--color-text)]">{s.nome}</h4>
                        <span className="text-[10px] text-[var(--color-text)]/40 font-semibold uppercase tracking-wider block">
                          Duração: {s.duracaoMinutos || 30} min
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--color-primary)]">
                          R$ {Number(s.preco).toFixed(2).replace('.', ',')}
                        </span>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-background)]' 
                            : 'border-[var(--color-text)]/20'
                        }`}>
                          {isSelected && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé Fixo do Passo com Valores */}
            {selectedServices.length > 0 && (
              <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-40">
                <button 
                  onClick={() => setStep('PROFISSIONAL')}
                  className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-between px-6 transition-all shadow-[0_4px_25px_var(--color-primary)]/20"
                >
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider opacity-75 block">
                      {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'} • {getDuracaoTotal()} min
                    </span>
                    <strong className="text-md">R$ {getValorTotal().toFixed(2).replace('.', ',')}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                    Próximo <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PROFISSIONAL */}
        {step === 'PROFISSIONAL' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-[var(--color-primary)]">Com quem deseja agendar?</h2>
              <p className="text-xs text-[var(--color-text)]/60">Selecione o profissional de sua preferência.</p>
            </div>

            {loadingProfissionais ? (
              <div className="py-16 text-center text-sm text-[var(--color-primary)]/50 animate-pulse">Carregando barbeiros...</div>
            ) : profissionais.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--color-text)]/40 italic">Nenhum profissional disponível.</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {profissionais.map(p => {
                  const isSelected = selectedProfissional?.id === p.id;
                  
                  // Gerar avatar com iniciais
                  const iniciais = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProfissional(p)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                        isSelected 
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50 shadow-[0_0_15px_var(--color-primary)]/10' 
                          : 'bg-[var(--color-surface)]/60 border-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/20'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-[var(--color-primary)] text-[var(--color-background)]' 
                          : 'bg-[var(--color-background)] text-[var(--color-primary)] border border-[var(--color-primary)]/15'
                      }`}>
                        {iniciais}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[var(--color-text)]">{p.nome}</h4>
                        <span className="text-[10px] text-[var(--color-text)]/40">Disponível hoje</span>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-background)]' 
                          : 'border-[var(--color-text)]/20'
                      }`}>
                        {isSelected && <Check size={14} className="stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé Fixo do Passo */}
            {selectedProfissional && (
              <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-40">
                <button 
                  onClick={() => setStep('DATA_HORA')}
                  className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-between px-6 transition-all shadow-[0_4px_25px_var(--color-primary)]/20"
                >
                  <span className="text-sm font-bold">Barbeiro: {selectedProfissional.nome}</span>
                  <div className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                    Próximo <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DATA & HORA */}
        {step === 'DATA_HORA' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-[var(--color-primary)]">Quando quer ser atendido?</h2>
              <p className="text-xs text-[var(--color-text)]/60">Escolha o melhor dia e horário livre.</p>
            </div>

            {/* Input de Data */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest block ml-1">Selecione a Data</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50">
                  <Calendar size={18} />
                </div>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[var(--color-surface)]/60 text-sm text-[var(--color-text)] rounded-2xl border border-[var(--color-primary)]/5 focus:border-[var(--color-primary)]/40 transition-all outline-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>
            </div>

            {/* Slots de Horários */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest block ml-1">Horários Livres</label>
              
              {loadingSlots ? (
                <div className="py-12 flex flex-col justify-center items-center gap-3">
                  <Loader2 className="animate-spin text-[var(--color-primary)]" size={24} />
                  <span className="text-xs text-[var(--color-primary)]/60">Verificando agenda do barbeiro...</span>
                </div>
              ) : slotsDisponiveis.length === 0 ? (
                <div className="bg-[var(--color-surface)]/30 border border-[var(--color-primary)]/5 rounded-2xl p-8 text-center text-xs text-[var(--color-text)]/40 italic">
                  Infelizmente não há horários livres para este barbeiro na data selecionada. Tente outro dia ou profissional.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {slotsDisponiveis.map(slot => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button 
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 text-xs font-bold rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-[var(--color-primary)] border-transparent text-[var(--color-background)] shadow-[0_0_15px_var(--color-primary)]/20' 
                            : 'bg-[var(--color-surface)]/60 border-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/25 text-[var(--color-text)]/80'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rodapé Fixo do Passo */}
            {selectedTime && (
              <div className="fixed bottom-6 left-0 right-0 px-6 max-w-md mx-auto z-40">
                <button 
                  onClick={() => setStep('CONFIRMAR')}
                  className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-between px-6 transition-all shadow-[0_4px_25px_var(--color-primary)]/20"
                >
                  <span className="text-sm font-bold capitalize">Horário: {selectedTime} ({new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})})</span>
                  <div className="flex items-center gap-1.5 uppercase tracking-widest text-xs">
                    Revisar <ChevronRight size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: CONFIRMAÇÃO */}
        {step === 'CONFIRMAR' && (
          <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif text-[var(--color-primary)]">Tudo pronto!</h2>
              <p className="text-xs text-[var(--color-text)]/60">Confirme as informações abaixo antes de agendar.</p>
            </div>

            {/* Card Resumo do Agendamento */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-primary)]/15 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="space-y-1 pb-3 border-b border-[var(--color-primary)]/5">
                <span className="text-[10px] text-[var(--color-text)]/40 font-bold uppercase tracking-widest block">Data e Horário</span>
                <p className="font-bold text-md capitalize text-[var(--color-text)]">{formatarData(selectedDate)}</p>
                <div className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-bold">
                  <Clock size={14} /> {selectedTime} <span className="text-[var(--color-text)]/40 font-normal">({getDuracaoTotal()} minutos previstos)</span>
                </div>
              </div>

              <div className="space-y-1 pb-3 border-b border-[var(--color-primary)]/5">
                <span className="text-[10px] text-[var(--color-text)]/40 font-bold uppercase tracking-widest block">Profissional</span>
                <div className="flex items-center gap-2 mt-1">
                  <User size={16} className="text-[var(--color-primary)]" />
                  <p className="text-sm font-semibold">{selectedProfissional?.nome}</p>
                </div>
              </div>

              <div className="space-y-1.5 pb-3 border-b border-[var(--color-primary)]/5">
                <span className="text-[10px] text-[var(--color-text)]/40 font-bold uppercase tracking-widest block">Serviços Selecionados</span>
                <div className="space-y-1 pt-1">
                  {selectedServices.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--color-text)]/70">{s.nome}</span>
                      <strong className="text-[var(--color-text)]/90">R$ {Number(s.preco).toFixed(2).replace('.', ',')}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-[var(--color-text)]">Total Estimado</span>
                <strong className="text-xl font-serif text-[var(--color-primary)]">
                  {usarCreditos ? (
                    <span className="text-sm text-green-400 font-bold uppercase tracking-wider">Pago com Créditos</span>
                  ) : (
                    `R$ ${getValorTotal().toFixed(2).replace('.', ',')}`
                  )}
                </strong>
              </div>
            </div>

            {/* Créditos de Assinatura Opção */}
            {assinatura && checkCreditosDisponiveis() && (
              <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={12} /> Assinatura Ativa
                  </h4>
                  <p className="text-[11px] text-[var(--color-text)]/70">
                    Você tem créditos no plano <strong>{assinatura.plano.nome}</strong>. Deseja usar para este agendamento?
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={usarCreditos}
                    onChange={(e) => setUsarCreditos(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)] peer-checked:after:bg-[var(--color-background)]"></div>
                </label>
              </div>
            )}

            {/* Campo Ativo do Cliente (Multi-Vertical) */}
            {tipoEmpresa && tipoEmpresa.toLowerCase() !== 'barbearia' && ativos.length > 1 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest block ml-1">Selecione o Ativo</label>
                <select 
                  value={selectedAtivoId} 
                  onChange={e => setSelectedAtivoId(e.target.value ? Number(e.target.value) : '')} 
                  className="w-full px-4 py-3.5 bg-[var(--color-surface)]/60 text-sm text-[var(--color-text)] rounded-2xl border border-[var(--color-primary)]/5 focus:border-[var(--color-primary)]/40 transition-all outline-none cursor-pointer text-xs"
                >
                  <option value="">Selecione o ativo...</option>
                  {ativos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.veiculo ? 'Veículo' : 'Animal de Estimação'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Campo Observação */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest block ml-1">Observações (Opcional)</label>
              <div className="relative group">
                <div className="absolute top-3.5 left-4 text-[var(--color-primary)]/50">
                  <MessageSquare size={16} />
                </div>
                <textarea 
                  rows={3}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Tem alguma preferência ou aviso especial? Digite aqui..."
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface)]/60 text-sm text-[var(--color-text)] rounded-2xl border border-[var(--color-primary)]/5 focus:border-[var(--color-primary)]/40 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Botão Final de Agendamento */}
            <button 
              onClick={handleConfirmAgendamento}
              disabled={submitting}
              className="w-full py-4 mt-6 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_25px_var(--color-primary)]/20 disabled:opacity-50 hover:scale-[1.01]"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Reservando horário...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Confirmar Agendamento</span>
                </>
              )}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
