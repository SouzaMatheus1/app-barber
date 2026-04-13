import React, { useState, useEffect } from 'react';
import { Calendar as Clock, User, X, CheckCircle2, Ban, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface Agendamento {
  id: number;
  dataHoraInicio: string;
  dataHoraFim: string;
  clienteId?: number | null;
  profissionalId: number;
  status: string;
  observacao?: string;
  cliente?: { id: number; nome: string; telefone: string };
  profissional?: { id: number; nome: string };
  servicos: { item: { id: number; nome: string; duracaoMinutos: number } }[];
}

interface Profissional {
  id: number;
  nome: string;
}

interface Cliente {
  id: number;
  nome: string;
}

interface Servico {
  id: number;
  nome: string;
  duracaoMinutos: number;
  preco: number;
  tipo: { descricao: string };
}

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProfissional, setSelectedProfissional] = useState<number>(0); // 0 = todos
  const navigate = useNavigate();

  // Modais Control
  const [isNovoAgendamentoModalOpen, setIsNovoAgendamentoModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // States Modal Novo Agendamento
  const [novoAgendamentoData, setNovoAgendamentoData] = useState(selectedDate);
  const [novoAgendamentoHora, setNovoAgendamentoHora] = useState('');
  const [novoAgendamentoProfissional, setNovoAgendamentoProfissional] = useState<number>(0);
  const [novoAgendamentoDuracao, setNovoAgendamentoDuracao] = useState<number>(30);
  const [novoAgendamentoClienteSearch, setNovoAgendamentoClienteSearch] = useState('');
  const [novoAgendamentoClienteId, setNovoAgendamentoClienteId] = useState<number | ''>('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // States Modal Bloqueio
  const [blockProfissional, setBlockProfissional] = useState<number>(0);
  const [blockData, setBlockData] = useState(selectedDate);
  const [blockHora, setBlockHora] = useState('');
  const [blockDuracao, setBlockDuracao] = useState<number>(60);
  const [blockMotivo, setBlockMotivo] = useState('');

  useEffect(() => {
    loadBasics();
  }, []);

  useEffect(() => {
    loadAgenda();
  }, [selectedDate, selectedProfissional]);

  const loadBasics = async () => {
    try {
      const [resProf, resCat, resCli] = await Promise.all([
        api.get('/profissionais'),
        api.get('/itens'),
        api.get('/clientes')
      ]);
      setProfissionais(resProf.data);
      setClientes(resCli.data);
      // Foca só em SERVIÇOS do catálogo
      const apenasServicos = resCat.data.filter((i: any) => i.tipo?.descricao === 'SERVICO');
      setServicos(apenasServicos);

      if (resProf.data.length > 0) {
        setNovoAgendamentoProfissional(resProf.data[0].id);
        setBlockProfissional(resProf.data[0].id);
      }
    } catch (error) {
      console.error("Erro carrengando base", error);
    }
  };

  const loadAgenda = async () => {
    try {
      setLoading(true);
      const url = selectedProfissional > 0 
        ? `/agendamentos?profissionalId=${selectedProfissional}` 
        : '/agendamentos';
        
      const response = await api.get(url);
      
      const filtered = response.data.filter((a: Agendamento) => 
        a.dataHoraInicio.includes(selectedDate)
      );
      setAgendamentos(filtered);
    } catch (error) {
      console.error("Erro ao carregar agenda", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/agendamentos/${id}/status`, { status: newStatus });
      await loadAgenda();
    } catch (error) {
      alert("Erro ao mudar o status.");
    }
  };

  const submitNovoAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAgendamentoProfissional) return alert('Selecione o profissional');
    if (!novoAgendamentoData || !novoAgendamentoHora) return alert('Selecione data e hora');
    if (novoAgendamentoDuracao < 10) return alert('A duração deve ser de pelo menos 10 minutos.');

    const dataInicio = new Date(`${novoAgendamentoData}T${novoAgendamentoHora}`);
    const dataFim = new Date(dataInicio.getTime() + novoAgendamentoDuracao * 60000);
    
    const obsVal = novoAgendamentoClienteSearch ? `Avulso: ${novoAgendamentoClienteSearch}` : 'Cliente Anônimo';

    try {
      await api.post('/agendamentos', {
        profissionalId: novoAgendamentoProfissional,
        clienteId: novoAgendamentoClienteId !== '' ? novoAgendamentoClienteId : undefined,
        servicosIds: [], // Agora a escolha de serviço é só no checkout na tela de Transações
        dataHoraInicio: dataInicio.toISOString(),
        dataHoraFim: dataFim.toISOString(),
        status: 'CONFIRMADO',
        observacao: novoAgendamentoClienteId !== '' ? 'Agendado pelo Painel' : obsVal
      });
      setIsNovoAgendamentoModalOpen(false);
      setNovoAgendamentoClienteId('');
      setNovoAgendamentoClienteSearch('');
      setNovoAgendamentoHora('');
      setNovoAgendamentoDuracao(30);
      await loadAgenda();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || "Erro desconhecido";
      alert(`Erro: ${errMsg}`);
    }
  };

  const submitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockData || !blockHora) return alert("Selecione a data e a hora do bloco.");
    
    const dataInicio = new Date(`${blockData}T${blockHora}`);
    const dataFim = new Date(dataInicio.getTime() + blockDuracao * 60000);

    try {
      await api.post('/agendamentos', {
        profissionalId: blockProfissional,
        servicosIds: [], // array vazio pro backend Prisma!
        dataHoraInicio: dataInicio.toISOString(),
        dataHoraFim: dataFim.toISOString(),
        status: 'INDISPONIVEL',
        observacao: blockMotivo || 'Intervalo/Pausa'
      });
      setIsBlockModalOpen(false);
      setBlockMotivo('');
      setBlockDuracao(60);
      setBlockHora('');
      await loadAgenda();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || "Erro desconhecido";
      alert(`Erro: ${errMsg}`);
    }
  };

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); 

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-[#D4AF37]/20 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Agenda Diária</h1>
          <p className="text-[#E5E5E5]/60 mt-1">Gerencie os horários dos profissionais em tempo real.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select 
            value={selectedProfissional}
            onChange={e => setSelectedProfissional(Number(e.target.value))}
            className="bg-[#1a1a1a] text-[#E5E5E5] border border-[#D4AF37]/30 rounded-lg px-4 py-2 outline-none"
          >
            <option value={0}>Todos os Profissionais</option>
            {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>

          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#1a1a1a] text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg outline-none px-4 py-2 font-bold cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <button 
          onClick={() => { setIsNovoAgendamentoModalOpen(true); setNovoAgendamentoData(selectedDate); }}
          className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#121212] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors uppercase text-sm tracking-widest"
        >
          <Scissors size={18} /> Novo Agendamento
        </button>  
        <button 
          onClick={() => { setIsBlockModalOpen(true); setBlockData(selectedDate); }}
          className="bg-[#1a1a1a] border border-red-500/50 hover:bg-red-500/10 text-red-500 font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors uppercase text-sm tracking-widest"
        >
          <Ban size={18} /> Bloquear Tempo
        </button>
      </div>

      {/* Linha do Tempo */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 shadow-lg p-3 sm:p-6 min-h-[60vh] relative overflow-hidden">
        {loading ? (
             <span className="text-[#D4AF37] animate-pulse flex justify-center mt-20">Atualizando grade...</span>
        ) : (
          <div className="relative">
            <div className="absolute left-[70px] sm:left-[80px] top-0 bottom-0 w-px bg-[#D4AF37]/10" />

            <div className="space-y-6">
              {hours.map(hour => {
                const timeString = `${hour.toString().padStart(2, '0')}:00`;
                
                const itemsDaHora = agendamentos.filter(a => new Date(a.dataHoraInicio).getHours() === hour);

                return (
                  <div key={hour} className="flex min-h-[80px] relative group">
                    <div className="w-[70px] sm:w-[80px] flex-shrink-0 flex items-start pt-2">
                        <span className="text-xs sm:text-sm font-bold text-[#E5E5E5]/40 group-hover:text-[#D4AF37]/70 transition-colors">
                            {timeString}
                        </span>
                    </div>

                    <div className="flex-1 border-b border-[#D4AF37]/5 pb-4 pl-2 sm:pl-4 pt-2 flex flex-col gap-3">
                        {itemsDaHora.length === 0 ? (
                            <div className="text-xs text-[#E5E5E5]/10 mt-1 hidden group-hover:block">Livre</div>
                        ) : (
                            itemsDaHora.map(ag => {
                                const isConcluido = ag.status === 'CONCLUIDO';
                                const isIndisponivel = ag.status === 'INDISPONIVEL';

                                if (isIndisponivel) {
                                  return (
                                    <div key={ag.id} className="p-3 rounded-lg border bg-red-950/20 border-red-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                       <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <strong className="text-red-500/80 text-sm">
                                              {new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(ag.dataHoraFim).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                            </strong>
                                            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold uppercase">{ag.status}</span>
                                          </div>
                                          <span className="text-xs text-[#E5E5E5]/50 mt-1">Barbeiro: {ag.profissional?.nome || `ID ${ag.profissionalId}`} | Motivo: {ag.observacao}</span>
                                       </div>
                                       <button onClick={() => handleUpdateStatus(ag.id, 'CANCELADO')} className="text-xs border border-red-500/30 px-3 py-1 rounded text-red-400 hover:bg-red-500/20">Remover Bloqueio</button>
                                    </div>
                                  )
                                }

                                return (
                                    <div key={ag.id} className={`
                                        p-3 sm:p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all
                                        ${isConcluido ? 'bg-green-900/10 border-green-500/20 opacity-60' : 'bg-[#121212] border-[#D4AF37]/30 shadow-md'}
                                    `}>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <strong className={isConcluido ? 'text-green-500/70 line-through text-sm sm:text-base' : 'text-[#D4AF37] text-sm sm:text-base'}>
                                                    {new Date(ag.dataHoraInicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(ag.dataHoraFim).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                </strong>
                                                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-bold ${isConcluido ? 'bg-green-500/20 text-green-500' : 'bg-[#D4AF37]/20 text-[#D4AF37]'}`}>
                                                    {ag.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[#E5E5E5]/80">
                                                <div className="flex items-center gap-2">
                                                  <User size={14} className="text-[#E5E5E5]/40"/>
                                                  <span className="font-medium text-xs sm:text-sm">{ag.cliente?.nome || ag.observacao || 'Cliente Anônimo'}</span>
                                                </div>
                                                <span className="text-[10px] text-[#D4AF37]/50 hidden sm:block">•</span>
                                                <span className="text-xs text-[#E5E5E5]/40">Barbeiro: {ag.profissional?.nome || ag.profissionalId}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {ag.servicos && ag.servicos.length > 0 ? (
                                                  ag.servicos.map((s, idx) => (
                                                      <span key={idx} className="text-[10px] sm:text-xs bg-[#1a1a1a] border border-[#D4AF37]/10 px-2 py-1 rounded text-[#E5E5E5]/60 flex items-center gap-1">
                                                         {s.item.nome} <span className="opacity-50 ml-0.5">({s.item.duracaoMinutos || 30}m)</span>
                                                      </span>
                                                  ))
                                                ) : (
                                                  <span className="text-[10px] text-[#E5E5E5]/40 italic">Serviços serão definidos no pagamento</span>
                                                )}
                                            </div>
                                        </div>

                                        {!isConcluido && (
                                            <div className="flex items-center gap-2 border-t border-[#D4AF37]/10 pt-3 md:pt-0 md:border-none">
                                                {ag.status !== 'EM_ANDAMENTO' && (
                                                  <button 
                                                    onClick={() => handleUpdateStatus(ag.id, 'EM_ANDAMENTO')}
                                                    className="px-2 sm:px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#121212] flex items-center gap-2 rounded text-[10px] sm:text-xs tracking-wider transition-colors font-bold"
                                                  >
                                                    <Clock size={14} /> Em Andamento
                                                  </button>
                                                )}
                                                
                                                <button 
                                                    onClick={() => {
                                                        const params = new URLSearchParams();
                                                        params.set('profissionalId', String(ag.profissionalId));
                                                        if (ag.clienteId) params.set('clienteId', String(ag.clienteId));
                                                        if (ag.cliente?.nome) params.set('clienteNome', ag.cliente.nome);
                                                        if (ag.observacao && !ag.cliente?.nome && !ag.observacao.includes('Agendado pelo Painel')) {
                                                            params.set('clienteNome', ag.observacao);
                                                        }
                                                        
                                                        // Enviar para transações pra finalizar e receber
                                                        navigate(`/transacoes?${params.toString()}`);
                                                        handleUpdateStatus(ag.id, 'CONCLUIDO');
                                                    }}
                                                    className="p-1.5 text-green-500/60 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors"
                                                    title="Finalizar e Ir Para Pagamento"
                                                >
                                                    <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                                                </button>

                                                <button 
                                                    onClick={() => handleUpdateStatus(ag.id, 'CANCELADO')}
                                                    className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Cancelar / Retirar"
                                                >
                                                    <X size={20} className="sm:w-6 sm:h-6" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Bloqueio */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={submitBlock} className="bg-[#121212] border border-red-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button type="button" onClick={() => setIsBlockModalOpen(false)} className="absolute top-4 right-4 text-[#E5E5E5]/50 hover:text-[#E5E5E5]">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
              <Ban size={20} /> Bloquear Agenda
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Profissional</label>
                <select required value={blockProfissional} onChange={e => setBlockProfissional(Number(e.target.value))} className="w-full mt-1 bg-[#1a1a1a] text-[#E5E5E5] border border-red-500/30 focus:border-red-500 rounded-lg px-4 py-2 outline-none">
                  <option value="">Selecione...</option>
                  {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Data e Hora do Início</label>
                <div className="flex gap-2.5 mt-1">
                  <input required type="date" value={blockData} onChange={e => setBlockData(e.target.value)} className="w-[160px] bg-[#1a1a1a] text-[#E5E5E5] border border-red-500/30 focus:border-red-500 rounded-lg px-4 py-2 outline-none" style={{ colorScheme: 'dark' }} />
                  <input required type="time" value={blockHora} onChange={e => setBlockHora(e.target.value)} className="flex-1 bg-[#1a1a1a] text-[#E5E5E5] border border-red-500/30 focus:border-red-500 rounded-lg px-4 py-2 outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Duração do Bloqueio (em minutos)</label>
                <input required type="number" step="10" min="10" value={blockDuracao} onChange={e => setBlockDuracao(Number(e.target.value))} className="w-full mt-1 bg-[#1a1a1a] text-[#E5E5E5] border border-red-500/30 focus:border-red-500 rounded-lg px-4 py-2 outline-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Motivo</label>
                <input type="text" value={blockMotivo} onChange={e => setBlockMotivo(e.target.value)} placeholder="Ex: Horário de Almoço" className="w-full mt-1 bg-[#1a1a1a] text-[#E5E5E5] border border-red-500/30 focus:border-red-500 rounded-lg px-4 py-2 outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full mt-8 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">
              Bloquear Tempo Agora
            </button>
          </form>
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {isNovoAgendamentoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={submitNovoAgendamento} className="bg-[#121212] border border-[#D4AF37]/30 rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setIsNovoAgendamentoModalOpen(false)} className="absolute top-4 right-4 text-[#E5E5E5]/50 hover:text-[#E5E5E5]">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-[#D4AF37] mb-6 flex items-center gap-2">
              <Scissors size={20} /> Agendar Serviço
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Profissional</label>
                <select required value={novoAgendamentoProfissional} onChange={e => setNovoAgendamentoProfissional(Number(e.target.value))} className="w-full mt-1 bg-[#1a1a1a] text-[#E5E5E5] border border-[#D4AF37]/30 rounded-lg px-4 py-2 outline-none">
                  <option value="">Selecione...</option>
                  {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Data e Hora</label>
                <div className="flex gap-2.5 mt-1">
                  <input required type="date" value={novoAgendamentoData} onChange={e => setNovoAgendamentoData(e.target.value)} className="w-[160px] bg-[#1a1a1a] text-[#E5E5E5] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg px-4 py-2 outline-none" style={{ colorScheme: 'dark' }} />
                  <input required type="time" value={novoAgendamentoHora} onChange={e => setNovoAgendamentoHora(e.target.value)} className="flex-1 bg-[#1a1a1a] text-[#E5E5E5] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg px-4 py-2 outline-none" style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={novoAgendamentoClienteSearch} 
                  onChange={e => {
                    setNovoAgendamentoClienteSearch(e.target.value);
                    setNovoAgendamentoClienteId(''); 
                    setShowClienteDropdown(true);
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                  placeholder="Selecione ou digite um nome avulso" 
                  className={`w-full mt-1 bg-[#1a1a1a] border border-[#D4AF37]/30 px-4 py-2 outline-none transition-colors ${novoAgendamentoClienteId !== '' ? 'text-[#D4AF37] font-bold' : 'text-[#E5E5E5]'}`} 
                  style={{ borderRadius: showClienteDropdown && clientes.filter(c => c.nome.toLowerCase().includes(novoAgendamentoClienteSearch.toLowerCase())).length > 0 ? '0.5rem 0.5rem 0 0' : '0.5rem' }}
                />
                
                {showClienteDropdown && (
                  <div className="absolute z-10 w-full bg-[#1a1a1a] border border-t-0 border-[#D4AF37]/30 rounded-b-lg max-h-40 overflow-y-auto shadow-2xl">
                    {clientes.filter(c => c.nome.toLowerCase().includes(novoAgendamentoClienteSearch.toLowerCase())).map(c => (
                      <div 
                        key={c.id} 
                        className="px-4 py-2 hover:bg-[#D4AF37]/10 cursor-pointer text-[#E5E5E5] text-sm flex items-center gap-2"
                        onClick={() => {
                           setNovoAgendamentoClienteId(c.id);
                           setNovoAgendamentoClienteSearch(c.nome);
                           setShowClienteDropdown(false);
                        }}
                      >
                        <User size={14} className="text-[#D4AF37]" /> {c.nome}
                      </div>
                    ))}
                    {clientes.filter(c => c.nome.toLowerCase().includes(novoAgendamentoClienteSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2 text-[#E5E5E5]/40 text-sm">Pressione Enter para salvar como avulso.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase">Tempo Previsto (em minutos)</label>
                <input required type="number" step="5" min="10" value={novoAgendamentoDuracao} onChange={e => setNovoAgendamentoDuracao(Number(e.target.value))} className="w-full mt-1 bg-[#1a1a1a] text-[#E5E5E5] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg px-4 py-2 outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full mt-8 bg-[#D4AF37] hover:bg-[#E5C158] text-[#121212] font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">
              Agendar Serviço
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
