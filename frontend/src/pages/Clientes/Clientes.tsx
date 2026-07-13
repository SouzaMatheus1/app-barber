import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, User, Users, Car, Box, X } from 'lucide-react';
import { ClienteService } from '../../services/ClienteService';
import { assinaturaService } from '../../services/AssinaturaService';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Cliente } from '../../services/ClienteService';

const clienteService = new ClienteService();

export function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [planoId, setPlanoId] = useState<number | ''>('');
  const [planos, setPlanos] = useState<any[]>([]);

  // Ativos States
  const [selectedClientForAtivos, setSelectedClientForAtivos] = useState<Cliente | null>(null);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [loadingAtivos, setLoadingAtivos] = useState(false);
  const [tiposAtivoPermitidos, setTiposAtivoPermitidos] = useState<any[]>([]);
  const [categoriasVeiculo, setCategoriasVeiculo] = useState<any[]>([]);
  const [especiesAnimal, setEspeciesAnimal] = useState<any[]>([]);

  // Ativo Form State
  const [ativoEditingId, setAtivoEditingId] = useState<number | null>(null);
  const [ativoNome, setAtivoNome] = useState('');
  const [ativoTipoId, setAtivoTipoId] = useState<number | ''>('');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [veiculoCor, setVeiculoCor] = useState('');
  const [veiculoAno, setVeiculoAno] = useState<number | ''>('');
  const [animalEspecie, setAnimalEspecie] = useState<number | ''>('');
  const [animalRaca, setAnimalRaca] = useState('');
  const [animalPorte, setAnimalPorte] = useState('');
  const [veiculoCategoria, setVeiculoCategoria] = useState<number | ''>('');

  const isBarbearia = user?.tipoEmpresa?.toLowerCase() === 'barbearia';

  useEffect(() => {
    loadClientes();
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      const res = await assinaturaService.getPlanos();
      setPlanos(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.listar();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      if (editingId) {
        await clienteService.editar(editingId, { 
          nome, 
          telefone, 
          planoId: planoId === '' ? 0 : Number(planoId) 
        });
      } else {
        await clienteService.criar({ 
          nome, 
          telefone, 
          planoId: planoId === '' ? 0 : Number(planoId) 
        });
      }
      resetForm();
      await loadClientes();
    } catch (error: any) {
      console.error("Erro ao salvar cliente", error);
      const msg = error.response?.data?.error || "Erro ao salvar cliente";
      alert(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    setLoadingAction(true);
    try {
      await clienteService.deletar(id);
      await loadClientes();
    } catch (error: any) {
      console.error("Erro ao excluir cliente", error);
      const msg = error.response?.data?.error || "Erro ao excluir cliente";
      alert(msg);
    } finally {
      setLoadingAction(false);
    }
  };

  const editClient = (cliente: Cliente) => {
    setIsEditing(true);
    setEditingId(Number(cliente.id)); // o banco as vezes traz Number object
    setNome(cliente.nome);
    setTelefone(cliente.telefone || '');
    if (cliente.assinaturas && cliente.assinaturas.length > 0) {
      setPlanoId(cliente.assinaturas[0].planoId);
    } else {
      setPlanoId('');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNome('');
    setTelefone('');
    setPlanoId('');
  };

  const loadAtivos = async (clienteId: number) => {
    try {
      setLoadingAtivos(true);
      const res = await api.get(`/clientes/${clienteId}/ativos`);
      setAtivos(res.data);
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar ativos do cliente');
    } finally {
      setLoadingAtivos(false);
    }
  };

  const loadTiposAtivo = async () => {
    try {
      const res = await api.get('/tipos-ativo');
      setTiposAtivoPermitidos(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const openAtivosModal = async (cliente: Cliente) => {
    setSelectedClientForAtivos(cliente);
    resetAtivoForm();
    try {
      setLoadingAtivos(true);
      const [ativosRes, tiposRes, categoriasRes, especiesRes] = await Promise.all([
        api.get(`/clientes/${cliente.id}/ativos`),
        api.get('/tipos-ativo'),
        api.get('/categorias-veiculo'),
        api.get('/especies-animal')
      ]);
      setAtivos(ativosRes.data);
      setTiposAtivoPermitidos(tiposRes.data);
      setCategoriasVeiculo(categoriasRes.data);
      setEspeciesAnimal(especiesRes.data);
      if (tiposRes.data && tiposRes.data.length > 0) {
        setAtivoTipoId(tiposRes.data[0].id);
      }
      if (categoriasRes.data && categoriasRes.data.length > 0) {
        setVeiculoCategoria(categoriasRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar ativos.');
    } finally {
      setLoadingAtivos(false);
    }
  };

  const resetAtivoForm = () => {
    setAtivoEditingId(null);
    setAtivoNome('');
    // Manter o tipoAtivoId se houver tipos permitidos para evitar resetar o select invisível
    if (tiposAtivoPermitidos.length > 0) {
      setAtivoTipoId(tiposAtivoPermitidos[0].id);
    } else {
      setAtivoTipoId('');
    }
    setVeiculoModelo('');
    setVeiculoPlaca('');
    setVeiculoCor('');
    setVeiculoAno('');
    setVeiculoCategoria(categoriasVeiculo.length > 0 ? categoriasVeiculo[0].id : '');
    setAnimalEspecie('');
    setAnimalRaca('');
    setAnimalPorte('');
  };

  const handleEditAtivo = (ativo: any) => {
    setAtivoEditingId(ativo.id);
    setAtivoNome(ativo.nome);
    setAtivoTipoId(ativo.tipoAtivoId);
    if (ativo.veiculo) {
      setVeiculoModelo(ativo.veiculo.modelo || '');
      setVeiculoPlaca(ativo.veiculo.placa || '');
      setVeiculoCor(ativo.veiculo.cor || '');
      setVeiculoAno(ativo.veiculo.ano || '');
      setVeiculoCategoria(ativo.veiculo.categoriaId || '');
    } else {
      setVeiculoModelo('');
      setVeiculoPlaca('');
      setVeiculoCor('');
      setVeiculoAno('');
      setVeiculoCategoria(categoriasVeiculo.length > 0 ? categoriasVeiculo[0].id : '');
    }
    if (ativo.animal) {
      setAnimalEspecie(ativo.animal.especieId || '');
      setAnimalRaca(ativo.animal.raca || '');
      setAnimalPorte(ativo.animal.porte || '');
    } else {
      setAnimalEspecie('');
      setAnimalRaca('');
      setAnimalPorte('');
    }
  };

  const handleDeleteAtivo = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este ativo?')) return;
    try {
      setLoadingAtivos(true);
      await api.delete(`/ativos/${id}`);
      if (selectedClientForAtivos) {
        await loadAtivos(Number(selectedClientForAtivos.id));
      }
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erro ao excluir ativo.');
    } finally {
      setLoadingAtivos(false);
    }
  };

  const handleSaveAtivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForAtivos) return;
    try {
      setLoadingAtivos(true);
      const isVeiculo = ativoTipoId === 1;
      const isAnimal = ativoTipoId === 2;

      const payload = {
        clienteId: Number(selectedClientForAtivos.id),
        tipoAtivoId: Number(ativoTipoId),
        nome: ativoNome,
        detalhesVeiculo: isVeiculo ? {
          modelo: veiculoModelo,
          categoriaId: Number(veiculoCategoria),
          ano: veiculoAno !== '' ? Number(veiculoAno) : undefined,
          cor: veiculoCor || undefined,
          placa: veiculoPlaca || undefined
        } : undefined,
        detalhesAnimal: isAnimal ? {
          especieId: Number(animalEspecie),
          raca: animalRaca || undefined,
          porte: animalPorte || undefined
        } : undefined
      };

      if (ativoEditingId) {
        await api.put(`/ativos/${ativoEditingId}`, {
          nome: ativoNome,
          detalhesVeiculo: payload.detalhesVeiculo,
          detalhesAnimal: payload.detalhesAnimal
        });
      } else {
        await api.post('/ativos', payload);
      }

      resetAtivoForm();
      await loadAtivos(Number(selectedClientForAtivos.id));
    } catch (e: any) {
      alert(e.response?.data?.error || 'Erro ao salvar ativo.');
    } finally {
      setLoadingAtivos(false);
    }
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <header className="flex justify-between items-end border-b border-[var(--color-primary)]/20 pb-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)]">Clientes</h1>
            <span className="bg-[var(--color-background)]/10 text-[var(--color-primary)] px-4 py-1.5 rounded-full text-lg font-bold border border-[var(--color-primary)]/30 shadow-sm flex items-center gap-2">
              <Users size={20} />
              {clientes.length} Cadastrados
            </span>
          </div>
          <p className="text-[var(--color-text)]/60 mt-1">Gerencie a base de clientes da {user?.tipoEmpresa?.toLowerCase() || 'empresa'}.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Cliente
          </button>
        )}
      </header>

      {/* Formulário de Criação/Edição */}
      {isEditing && (
        <form onSubmit={handleCreateOrUpdate} className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-primary)]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <User className="text-[var(--color-primary)]" size={20} />
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Nome</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: Carlos Silva"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="Ex: 11999999999"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Vincular Plano <span className="text-[var(--color-text)]/40 text-[10px] ml-1">(Opcional)</span>
              </label>
              <div className="relative">
                <select
                  value={planoId}
                  onChange={e => setPlanoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sem plano ativo</option>
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} - R$ {Number(p.valorMensal).toFixed(2)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--color-primary)]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 py-2 text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors uppercase text-sm font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loadingAction}
              className="px-8 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAction && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Clientes */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background)]">
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Nome</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Telefone</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Data de Cadastro</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Plano selecionado</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-primary)]/10">
              {clientes.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--color-text)]/50">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id.toString()} className="hover:bg-[var(--color-primary)]/5 transition-colors group">
                    <td className="py-4 px-6 text-[var(--color-text)] font-medium">{cliente.nome}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">{cliente.telefone || '-'}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/60 text-sm">
                      {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">{cliente.assinaturas?.[0]?.plano.nome || '-'}</td>
                    <td className="py-4 px-6 text-right space-x-3">
                      {!isBarbearia && (
                        <button 
                          onClick={() => openAtivosModal(cliente)}
                          className="text-[var(--color-text)]/50 hover:text-[var(--color-primary)] transition-colors p-1"
                          title="Ativos"
                        >
                          <Car size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => editClient(cliente)}
                        className="text-[var(--color-text)]/50 hover:text-[var(--color-primary)] transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(Number(cliente.id))}
                        className="text-[var(--color-text)]/50 hover:text-red-500 transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ativos */}
      {selectedClientForAtivos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-primary)]/30 rounded-xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              type="button" 
              onClick={() => setSelectedClientForAtivos(null)} 
              className="absolute top-4 right-4 text-[var(--color-text)]/50 hover:text-[var(--color-text)]"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6 flex items-center gap-2">
              <Car size={20} /> Ativos de {selectedClientForAtivos.nome}
            </h2>

            {/* Listagem de Ativos do Cliente */}
            <div className="mb-8 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text)]/85 uppercase tracking-wider">Ativos Cadastrados</h3>
              {loadingAtivos && ativos.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                </div>
              ) : ativos.length === 0 ? (
                <p className="text-xs text-[var(--color-text)]/40 italic">Nenhum ativo cadastrado para este cliente.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ativos.map(ativo => (
                    <div key={ativo.id} className="bg-[var(--color-background)] border border-[var(--color-primary)]/10 rounded-lg p-4 flex flex-col justify-between relative group hover:border-[var(--color-primary)]/30 transition-all">
                      <div>
                        <div className="flex justify-between items-start">
                          <strong className="text-sm text-[var(--color-text)] font-semibold">{ativo.nome}</strong>
                          <span className="text-[9px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            {ativo.tipoAtivoId === 1 ? 'Veículo' : 'Animal'}
                          </span>
                        </div>
                        {ativo.veiculo && (
                          <div className="mt-2 text-xs text-[var(--color-text)]/60 space-y-0.5">
                            <p>Modelo: {ativo.veiculo.modelo}</p>
                            <p>Categoria: {ativo.veiculo.categoria?.descricao || '-'}</p>
                            {ativo.veiculo.placa && <p>Placa: {ativo.veiculo.placa}</p>}
                            {ativo.veiculo.cor && <p>Cor: {ativo.veiculo.cor}</p>}
                            {ativo.veiculo.ano && <p>Ano: {ativo.veiculo.ano}</p>}
                          </div>
                        )}
                        {ativo.animal && (
                          <div className="mt-2 text-xs text-[var(--color-text)]/60 space-y-0.5">
                            <p>Espécie: {ativo.animal.especie?.descricao || '-'}</p>
                            {ativo.animal.raca && <p>Raça: {ativo.animal.raca}</p>}
                            {ativo.animal.porte && <p>Porte: {ativo.animal.porte}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-[var(--color-primary)]/5">
                        <button 
                          onClick={() => handleEditAtivo(ativo)} 
                          className="text-xs text-[var(--color-text)]/40 hover:text-[var(--color-primary)] transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteAtivo(ativo.id)} 
                          className="text-xs text-[var(--color-text)]/40 hover:text-red-500 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário de Cadastro/Edição de Ativo */}
            <form onSubmit={handleSaveAtivo} className="border-t border-[var(--color-primary)]/20 pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)]/85 uppercase tracking-wider">
                {ativoEditingId ? 'Editar Ativo' : 'Adicionar Novo Ativo'}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--color-text)]/80 uppercase">Nome/Identificação</label>
                  <input
                    type="text"
                    required
                    value={ativoNome}
                    onChange={e => setAtivoNome(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                    placeholder="Ex: Civic Prata ou Rex"
                  />
                </div>
              </div>

              {/* Campos dinâmicos baseados no tipo do ativo */}
              {ativoTipoId === 1 && ( // Veículo
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-[var(--color-background)]/50 p-4 rounded-lg border border-[var(--color-primary)]/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={veiculoModelo}
                      onChange={e => setVeiculoModelo(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: Civic"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Categoria *</label>
                    <select
                      required
                      value={veiculoCategoria}
                      onChange={e => setVeiculoCategoria(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm cursor-pointer"
                    >
                      {categoriasVeiculo.map(c => (
                        <option key={c.id} value={c.id}>{c.descricao}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Placa</label>
                    <input
                      type="text"
                      value={veiculoPlaca}
                      onChange={e => setVeiculoPlaca(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: ABC-1234"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Cor</label>
                    <input
                      type="text"
                      value={veiculoCor}
                      onChange={e => setVeiculoCor(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: Cinza"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Ano</label>
                    <input
                      type="number"
                      value={veiculoAno === '' ? '' : veiculoAno}
                      onChange={e => setVeiculoAno(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: 2020"
                    />
                  </div>
                </div>
              )}

              {ativoTipoId === 2 && ( // Animal de Estimação
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[var(--color-background)]/50 p-4 rounded-lg border border-[var(--color-primary)]/10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Espécie *</label>
                    <select
                      required
                      value={animalEspecie}
                      onChange={e => setAnimalEspecie(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {especiesAnimal.map(e => (
                        <option key={e.id} value={e.id}>{e.descricao}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Raça</label>
                    <input
                      type="text"
                      value={animalRaca}
                      onChange={e => setAnimalRaca(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: Labrador"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--color-text)]/70 uppercase">Porte</label>
                    <input
                      type="text"
                      value={animalPorte}
                      onChange={e => setAnimalPorte(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-background)] text-[var(--color-text)] rounded border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] text-sm"
                      placeholder="Ex: Grande"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                {ativoEditingId && (
                  <button 
                    type="button" 
                    onClick={resetAtivoForm}
                    className="px-4 py-2 text-xs text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors uppercase font-bold"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={loadingAtivos}
                  className="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded uppercase tracking-wider text-xs transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingAtivos && <Loader2 size={12} className="animate-spin" />}
                  {ativoEditingId ? 'Salvar Alterações' : 'Adicionar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}