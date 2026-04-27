import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  DollarSign, 
  Tag, 
  Calendar as CalendarIcon, 
  History,
  AlertCircle,
  TrendingDown,
  ArrowDownCircle,
} from 'lucide-react';
import { transacaoService } from '../../services/TransacaoService';
import { categoriaCustoService, type CategoriaCusto } from '../../services/CategoriaCustoService';
import dayjs from 'dayjs';

const Custos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nova' | 'historico' | 'categorias'>('nova');
  
  // Form State
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [formaPagamentoId, setFormaPagamentoId] = useState<string>('1');
  const [data, setData] = useState(new Date().toISOString().slice(0, 16));
  
  // Data State
  const [categorias, setCategorias] = useState<CategoriaCusto[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Categoria Form
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loadingCategoria, setLoadingCategoria] = useState(false);

  useEffect(() => {
    carregarCategorias();
    if (activeTab === 'historico') {
      carregarHistorico();
    }
  }, [activeTab]);

  const carregarCategorias = async () => {
    try {
      const data = await categoriaCustoService.listar();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarHistorico = async () => {
    setLoadingHistory(true);
    try {
      const data = await transacaoService.listar();
      // Filtrar apenas SAIDAS (tipo 2)
      setHistorico(data.filter((t: any) => t.tipoTransacaoId === 2));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSalvarCusto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await transacaoService.create({
        descricao,
        valorTotal: Number(valor),
        tipoTransacaoId: 2, // SAIDA
        categoriaCustoId: categoriaId ? Number(categoriaId) : null,
        formaPagamentoId: Number(formaPagamentoId),
        data: new Date(data).toISOString(),
        profissionalId: null,
        itens: []
      });
      
      setSuccess(true);
      setValor('');
      setDescricao('');
      setCategoriaId('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    
    setLoadingCategoria(true);
    try {
      await categoriaCustoService.criar(novaCategoria);
      setNovaCategoria('');
      carregarCategorias();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategoria(false);
    }
  };

  const handleDeletarTransacao = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    try {
      await transacaoService.deletar(id);
      carregarHistorico();
    } catch (err) {
      alert('Erro ao excluir');
    }
  };

  const handleDeletarCategoria = async (id: number) => {
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      await categoriaCustoService.deletar(id);
      carregarCategorias();
    } catch (err) {
      alert('Erro ao excluir categoria (pode haver transações vinculadas)');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingDown className="text-red-500 w-8 h-8" />
            Gestão de Custos
          </h1>
          <p className="text-gray-400 mt-1">Controle suas despesas e saídas de caixa</p>
        </div>
        
        <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/5 shadow-2xl">
          <button
            onClick={() => setActiveTab('nova')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'nova' 
                ? 'bg-red-500/10 text-red-500 shadow-inner' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus size={18} />
            Nova Saída
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'historico' 
                ? 'bg-red-500/10 text-red-500 shadow-inner' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History size={18} />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'categorias' 
                ? 'bg-red-500/10 text-red-500 shadow-inner' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag size={18} />
            Categorias
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'nova' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-red-500/10" />
                
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <ArrowDownCircle className="text-red-500" />
                  Registrar Nova Despesa
                </h2>

                <form onSubmit={handleSalvarCusto} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Valor da Saída (R$)</label>
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 group-focus-within:scale-110 transition-transform" size={20} />
                        <input
                          type="number"
                          required
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-gray-600"
                          placeholder="35.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Data e Hora</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                          type="datetime-local"
                          required
                          value={data}
                          onChange={(e) => setData(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Categoria</label>
                      <select
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all appearance-none"
                      >
                        <option value="">Geral / Sem Categoria</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.descricao}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Forma de Pagamento</label>
                      <select
                        value={formaPagamentoId}
                        onChange={(e) => setFormaPagamentoId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                      >
                        <option value="1">Dinheiro</option>
                        <option value="2">Cartão de Crédito</option>
                        <option value="3">Cartão de Débito</option>
                        <option value="4">PIX</option>
                        <option value="5">Transferência</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 ml-1">Descrição / Observação</label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all min-h-[120px]"
                      placeholder="Ex: Pagamento de aluguel ref. mês Abril"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 text-red-500 animate-shake">
                      <AlertCircle size={20} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-xl shadow-red-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] mt-4"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    {loading ? 'Processando...' : 'Finalizar Lançamento'}
                  </button>
                </form>

                {success && (
                  <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center animate-in zoom-in duration-300 z-10">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="text-green-500 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Lançado com Sucesso!</h3>
                    <p className="text-gray-400 mt-2">A despesa foi registrada no caixa.</p>
                    <button 
                      onClick={() => setSuccess(false)}
                      className="mt-6 text-red-500 hover:underline"
                    >
                      Fazer outro lançamento
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/10 rounded-3xl p-6">
                <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Dica de Controle
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Lançar suas despesas diariamente ajuda a manter o <strong>Faturamento Líquido</strong> real da sua empresa sempre atualizado no painel de controle.
                </p>
              </div>
              
              <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6">
                <h3 className="text-white font-bold mb-4">Resumo Rápido</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-sm">Categorias</span>
                    <span className="text-white font-bold">{categorias.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-gray-400 text-sm">Ações</span>
                    <button onClick={() => setActiveTab('categorias')} className="text-red-500 text-sm font-medium hover:underline">Gerenciar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">Data</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">Descrição</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400">Categoria</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Valor</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <Loader2 className="animate-spin text-red-500 mx-auto w-10 h-10" />
                        <p className="text-gray-500 mt-4">Carregando histórico...</p>
                      </td>
                    </tr>
                  ) : historico.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <History className="text-gray-600 mx-auto mb-4" size={48} />
                        <p className="text-gray-400">Nenhuma despesa registrada ainda.</p>
                      </td>
                    </tr>
                  ) : (
                    historico.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-gray-300">
                          {dayjs(item.data).format('DD/MM/YYYY HH:mm')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{item.descricao || 'Sem descrição'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                            {item.categoriaCusto?.descricao || 'Geral'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-red-500 font-bold">
                            - R$ {Number(item.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeletarTransacao(item.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
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
        )}

        {activeTab === 'categorias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Tag className="text-red-500" />
                Nova Categoria
              </h2>
              <form onSubmit={handleCriarCategoria} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                    placeholder="Ex: Aluguel, Luz, Marketing..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingCategoria}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  {loadingCategoria ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Adicionar Categoria
                </button>
              </form>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-6">Categorias Existentes</h2>
              <div className="space-y-3">
                {categorias.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 italic">Nenhuma categoria cadastrada.</p>
                ) : (
                  categorias.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl group hover:border-red-500/30 transition-all">
                      <span className="text-white font-medium">{cat.descricao}</span>
                      <button
                        onClick={() => handleDeletarCategoria(cat.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Custos;
