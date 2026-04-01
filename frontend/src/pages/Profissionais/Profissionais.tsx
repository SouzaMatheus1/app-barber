import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, UserCog } from 'lucide-react';
import { profissionalService } from '../../services/ProfissionalService';

export function Profissionais() {
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfilId, setPerfilId] = useState<number>(2); // 1 = ADMIN, 2 = BARBEIRO

  useEffect(() => {
    loadProfissionais();
  }, []);

  const loadProfissionais = async () => {
    try {
      setLoading(true);
      const data = await profissionalService.listar();
      setProfissionais(data);
    } catch (error) {
      console.error("Erro ao carregar profissionais", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      if (editingId) {
        // Ao editar, o envio da senha é opcional. Se vazia, removemos do payload.
        const payload = { nome, email, perfilId, ...(senha ? { senha } : {}) };
        await profissionalService.editar(editingId, payload);
      } else {
        await profissionalService.criar({ nome, email, senha, perfilId });
      }
      resetForm();
      await loadProfissionais();
    } catch (error) {
      console.error("Erro ao salvar profissional", error);
      alert("Falha ao salvar. Verifique se o e-mail já está em uso.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este profissional?")) return;
    setLoadingAction(true);
    try {
      await profissionalService.deletar(id);
      await loadProfissionais();
    } catch (error) {
      console.error("Erro ao excluir profissional", error);
      alert("Erro ao excluir profissional");
    } finally {
      setLoadingAction(false);
    }
  };

  const editProfissional = (profissional: any) => {
    setIsEditing(true);
    setEditingId(Number(profissional.id));
    setNome(profissional.nome);
    setEmail(profissional.email);
    setSenha(''); // Senha inicia vazia para edição
    setPerfilId(profissional.perfil?.id || 2);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNome('');
    setEmail('');
    setSenha('');
    setPerfilId(2);
  };

  if (loading && profissionais.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <header className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Profissionais</h1>
          <p className="text-[#E5E5E5]/60 mt-1">Gerencie a equipe de barbeiros e administradores.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Profissional
          </button>
        )}
      </header>

      {/* Formulário de Criação/Edição */}
      {isEditing && (
        <form onSubmit={handleCreateOrUpdate} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[#E5E5E5] flex items-center gap-2">
            <UserCog className="text-[#D4AF37]" size={20} />
            {editingId ? 'Editar Profissional' : 'Novo Profissional'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Nome</label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Nome do profissional"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">E-mail (Login)</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="exemplo@barbearia.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">
                Senha {editingId && <span className="text-[#E5E5E5]/40 text-[10px] ml-1">(Opcional para ignorar alteração)</span>}
              </label>
              <input
                type="password"
                required={!editingId}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Perfil</label>
              <div className="relative">
                <select
                  required
                  value={perfilId}
                  onChange={e => setPerfilId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors appearance-none cursor-pointer"
                >
                  <option value={2}>Barbeiro</option>
                  <option value={1}>Administrador</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#D4AF37]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-6 py-2 text-[#E5E5E5]/60 hover:text-[#E5E5E5] transition-colors uppercase text-sm font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loadingAction}
              className="px-8 py-2 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loadingAction && <Loader2 size={16} className="animate-spin" />}
              {editingId ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Profissionais */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121212]">
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Nome</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">E-mail</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Perfil</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Data de Cadastro</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {profissionais.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#E5E5E5]/50">Nenhum profissional cadastrado.</td>
                </tr>
              ) : (
                profissionais.map((profissional) => (
                  <tr key={profissional.id.toString()} className="hover:bg-[#D4AF37]/5 transition-colors group">
                    <td className="py-4 px-6 text-[#E5E5E5] font-medium">{profissional.nome}</td>
                    <td className="py-4 px-6 text-[#E5E5E5]/80">{profissional.email}</td>
                    <td className="py-4 px-6 text-[#E5E5E5]/80">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        profissional.perfil?.descricao === 'ADMIN' 
                        ? 'bg-[#121212] border-blue-500/30 text-blue-400'
                        : 'bg-[#121212] border-[#D4AF37]/30 text-[#D4AF37]'
                      }`}>
                        {profissional.perfil?.descricao || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#E5E5E5]/60 text-sm">
                      {new Date(profissional.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button 
                        onClick={() => editProfissional(profissional)}
                        className="text-[#E5E5E5]/50 hover:text-[#D4AF37] transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(Number(profissional.id))}
                        className="text-[#E5E5E5]/50 hover:text-red-500 transition-colors p-1"
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
    </div>
  );
}