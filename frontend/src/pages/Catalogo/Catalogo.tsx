import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Scissors } from 'lucide-react';
import { itemCatalogoService } from '../../services/ItemCatalogoService';

export function Catalogo() {
  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState<number | ''>('');
  const [comissao, setComissao] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const [tipoItemId, setTipoItemId] = useState<number>(1); // 1 = SERVICO, 2 = PRODUTO

  useEffect(() => {
    loadItens();
  }, []);

  const loadItens = async () => {
    try {
      setLoading(true);
      const data = await itemCatalogoService.listar();
      setItens(data);
    } catch (error) {
      console.error("Erro ao carregar itens do catálogo", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const payload = { 
        nome, 
        preco: Number(preco), 
        comissao: comissao ? Number(comissao) : null, 
        quantidade: quantidade ? Number(quantidade) : 0,
        tipoItemId 
      };

      if (editingId) {
        await itemCatalogoService.editar(editingId, payload);
      } else {
        await itemCatalogoService.criar(payload);
      }
      resetForm();
      await loadItens();
    } catch (error: any) {
      console.error("Erro ao salvar item do catálogo", error);
      if (error.response?.data?.error?.includes('DUPLICATE_ITEM')) {
        alert("Já existe um serviço ou produto com este exato nome no catálogo.");
      } else {
        alert("Falha ao salvar o item do catálogo.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este item do catálogo?")) return;
    setLoadingAction(true);
    try {
      await itemCatalogoService.deletar(id);
      await loadItens();
    } catch (error) {
      console.error("Erro ao excluir item", error);
      alert("Erro ao excluir item");
    } finally {
      setLoadingAction(false);
    }
  };

  const editItem = (item: any) => {
    setIsEditing(true);
    setEditingId(Number(item.id));
    setNome(item.nome);
    setPreco(Number(item.preco));
    setComissao(item.comissao ? Number(item.comissao) : '');
    setQuantidade(item.quantidade ?? '');
    setTipoItemId(item.tipo?.id || 1);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNome('');
    setPreco('');
    setComissao('');
    setQuantidade('');
    setTipoItemId(1);
  };

  if (loading && itens.length === 0) {
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
          <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)]">Catálogo</h1>
          <p className="text-[var(--color-text)]/60 mt-1">Gerencie os serviços prestados e produtos em venda.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] transition-colors text-sm"
          >
            <Plus size={18} /> Novo Item
          </button>
        )}
      </header>

      {/* Formulário de Criação/Edição */}
      {isEditing && (
        <form onSubmit={handleCreateOrUpdate} className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-primary)]/30 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Scissors className="text-[var(--color-primary)]" size={20} />
            {editingId ? 'Editar Item do Catálogo' : 'Novo Item do Catálogo'}
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
                placeholder="Ex: Corte Degrade ou Pomada"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Tipo</label>
              <div className="relative">
                <select
                  required
                  value={tipoItemId}
                  onChange={e => setTipoItemId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none cursor-pointer"
                >
                  <option value={1}>Serviço</option>
                  <option value={2}>Produto</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[var(--color-primary)]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            {/* Campo de Quantidade (aparece apenas para Produto) */}
            {tipoItemId === 2 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Quantidade em Estoque</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={quantidade}
                  onChange={e => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={preco}
                onChange={e => setPreco(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="35.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">
                Comissão (%) <span className="text-[var(--color-text)]/40 text-[10px] ml-1">(Opcional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={comissao}
                onChange={e => setComissao(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                placeholder="40.00"
              />
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

      {/* Tabela de Itens */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-primary)]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background)]">
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Nome</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Tipo</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-center">Quantidade</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider">Comissão (%)</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Preço</th>
                <th className="py-4 px-6 text-[var(--color-text)]/70 font-semibold text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-primary)]/10">
              {itens.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--color-text)]/50">Nenhum item cadastrado no catálogo.</td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.id.toString()} className="hover:bg-[var(--color-primary)]/5 transition-colors group">
                    <td className="py-4 px-6 text-[var(--color-text)] font-medium">{item.nome}</td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.tipo?.descricao === 'SERVICO' 
                        ? 'bg-[var(--color-background)] border-indigo-500/30 text-indigo-400'
                        : 'bg-[var(--color-background)] border-orange-500/30 text-orange-400'
                      }`}>
                        {item.tipo?.descricao || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80 text-center">
                      {item.tipo?.descricao === 'SERVICO' ? (
                        <span className="text-[var(--color-text)]/40">-</span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${item.quantidade > 5 ? 'bg-green-500/10 text-green-400 border-green-500/20' : item.quantidade > 0 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                           {item.quantidade} un
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[var(--color-text)]/80">
                      {item.comissao ? `${Number(item.comissao).toFixed(2)}%` : '-'}
                    </td>
                    <td className="py-4 px-6 text-[var(--color-primary)] font-bold text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco))}
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button 
                        onClick={() => editItem(item)}
                        className="text-[var(--color-text)]/50 hover:text-[var(--color-primary)] transition-colors p-1"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(Number(item.id))}
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
    </div>
  );
}