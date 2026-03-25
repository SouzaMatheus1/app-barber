import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
// import { TransacaoService } from '../../services/TransacaoService';

interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const Transacoes: React.FC = () => {
  const [clientName, setClientName] = useState('');
  const [professional, setProfessional] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([
    { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Catálogo mock de serviços
  const catalog = [
    { name: 'Corte Degradê', price: 45 },
    { name: 'Barba Simples', price: 30 },
    { name: 'Barba Terapia', price: 40 },
    { name: 'Corte + Barba', price: 80 },
    { name: 'Pomada Modeladora', price: 60 },
  ];

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof TransactionItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Preenchimento automatico do preço se o nome for de um serviço conhecido
        if (field === 'name') {
          const found = catalog.find(c => c.name === value);
          if (found) {
            updatedItem.price = found.price;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const payload = {
        clientName,
        professional,
        items,
        total: calculateTotal(),
        date: new Date().toISOString()
      };
      
      // Simulação da chamada da API
      // await TransacaoService.create(payload);
      console.log('Transação registrada:', payload);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // fake delay
      setSuccess(true);
      
      // Reset apos sucesso
      setTimeout(() => {
        setSuccess(false);
        setClientName('');
        setProfessional('');
        setItems([{ id: crypto.randomUUID(), name: '', quantity: 1, price: 0 }]);
      }, 2000);

    } catch (error) {
      console.error('Erro ao registrar transação', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#D4AF37]">Nova Transação</h1>
        <p className="text-[#E5E5E5]/60 mt-1">Registre um novo atendimento ou venda.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl border border-[#D4AF37]/20 shadow-lg p-6 md:p-8 space-y-8 relative overflow-hidden">
        
        {/* Overlay de Sucesso */}
        {success && (
          <div className="absolute inset-0 bg-[#121212]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={64} className="text-[#D4AF37] mb-4" />
            <h2 className="text-2xl font-bold text-[#E5E5E5]">Transação Registrada!</h2>
            <p className="text-[#D4AF37] mt-2 text-lg">Sucesso na operação.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Nome do Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 placeholder-[#E5E5E5]/30"
              placeholder="Ex: João Silva ou Avulso"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#E5E5E5]/80 uppercase tracking-wider">Profissional</label>
            <div className="relative">
              <select
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] text-[#E5E5E5] rounded-lg border border-[#D4AF37]/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300 appearance-none"
                required
              >
                <option value="" disabled>Selecione o barbeiro ou atendente</option>
                <option value="marcos">Marcos</option>
                <option value="lucas">Lucas</option>
                <option value="recepcao">Recepção (Apenas Produtos)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#D4AF37]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-2">
            <h3 className="text-lg font-bold text-[#D4AF37]">Itens do Serviço/Produto</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs flex items-center gap-1 text-[#E5E5E5] bg-[#121212] px-3 py-1.5 rounded-md border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors uppercase font-medium tracking-wider"
            >
              <Plus size={14} /> Adicionar Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-[#121212] p-4 rounded-lg border border-[#D4AF37]/10">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Item</label>
                  <input
                    type="text"
                    list="catalog-list"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    placeholder="Serviço ou Produto"
                    className="w-full bg-transparent text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 placeholder-[#E5E5E5]/30 leading-tight"
                    required
                  />
                  <datalist id="catalog-list">
                    {catalog.map(c => <option key={c.name} value={c.name} />)}
                  </datalist>
                </div>
                
                <div className="w-full md:w-24 space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full bg-transparent text-[#E5E5E5] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] px-2 py-1 text-center font-medium"
                    required
                  />
                </div>

                <div className="w-full md:w-32 space-y-1">
                  <label className="text-[10px] text-[#E5E5E5]/50 uppercase tracking-wider md:hidden">Preço Un (R$)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-1 text-[#E5E5E5]/50 text-sm pl-2">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                      className="w-full bg-transparent text-[#D4AF37] border-b border-[#D4AF37]/30 focus:outline-none focus:border-[#D4AF37] py-1 pl-8 pr-2 font-bold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={items.length === 1}
                  className="mt-4 md:mt-0 p-2 text-[#E5E5E5]/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed mx-auto md:mx-0 flex"
                  title="Remover item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/20 pt-6 flex flex-col items-end gap-6">
          <div className="text-right">
            <p className="text-[#E5E5E5]/60 text-sm uppercase tracking-wider font-semibold mb-1">Total da Transação</p>
            <p className="text-4xl font-bold font-serif text-[#D4AF37]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-[#D4AF37] text-[#121212] font-bold rounded-lg uppercase tracking-wider hover:bg-[#E5C158] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            {loading ? 'Processando...' : 'Finalizar Transação'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Transacoes;
