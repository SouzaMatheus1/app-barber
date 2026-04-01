import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, User } from 'lucide-react';
import { ClienteService } from '../../services/ClienteService';
import type { Cliente } from '../../services/ClienteService';

const clienteService = new ClienteService();

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    loadClientes();
  }, []);

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
        await clienteService.editar(editingId, { nome, telefone });
      } else {
        await clienteService.criar({ nome, telefone });
      }
      resetForm();
      await loadClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente", error);
      alert("Erro ao salvar cliente");
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
    } catch (error) {
      console.error("Erro ao excluir cliente", error);
      alert("Erro ao excluir cliente");
    } finally {
      setLoadingAction(false);
    }
  };

  const editClient = (cliente: Cliente) => {
    setIsEditing(true);
    setEditingId(Number(cliente.id)); // o banco as vezes traz Number object
    setNome(cliente.nome);
    setTelefone(cliente.telefone || '');
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNome('');
    setTelefone('');
  };

  if (loading && clientes.length === 0) {
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
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Clientes</h1>
          <p className="text-[#E5E5E5]/60 mt-1">Gerencie a base de clientes da barbearia.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Cliente
          </button>
        )}
      </header>

      {/* Formulário de Criação/Edição */}
      {isEditing && (
        <form onSubmit={handleCreateOrUpdate} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#D4AF37]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[#E5E5E5] flex items-center gap-2">
            <User className="text-[#D4AF37]" size={20} />
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
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
                placeholder="Ex: Carlos Silva"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Ex: 11999999999"
              />
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

      {/* Tabela de Clientes */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121212]">
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Nome</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Telefone</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider">Data de Cadastro</th>
                <th className="py-4 px-6 text-[#E5E5E5]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {clientes.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#E5E5E5]/50">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id.toString()} className="hover:bg-[#D4AF37]/5 transition-colors group">
                    <td className="py-4 px-6 text-[#E5E5E5] font-medium">{cliente.nome}</td>
                    <td className="py-4 px-6 text-[#E5E5E5]/80">{cliente.telefone || '-'}</td>
                    <td className="py-4 px-6 text-[#E5E5E5]/60 text-sm">
                      {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button 
                        onClick={() => editClient(cliente)}
                        className="text-[#E5E5E5]/50 hover:text-[#D4AF37] transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(Number(cliente.id))}
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