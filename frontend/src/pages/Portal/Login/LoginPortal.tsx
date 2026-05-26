import React, { useState } from 'react';
import { Smartphone, Lock, User, Mail, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePortalAuth } from '../../../contexts/PortalAuthContext';
import { api } from '../../../services/api';

export default function LoginPortal() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'PHONE' | 'PASSWORD' | 'REGISTER'>('PHONE');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { login } = usePortalAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    
    setLoading(true);
    setServerMessage('');
    try {
      const res = await api.post(`/portal/${slug}/auth/check-phone`, { telefone: phone });
      
      if (res.data.status === 'EXISTS_WITH_PASSWORD') {
        setStep('PASSWORD');
      } else if (res.data.status === 'EXISTS_WITHOUT_PASSWORD') {
        setNome(res.data.nome);
        setServerMessage(`Olá ${res.data.nome.split(' ')[0]}, bem-vindo(a) de volta! Crie uma senha para proteger sua conta.`);
        setStep('REGISTER');
      } else {
        setServerMessage('Bem-vindo(a)! Vamos criar o seu acesso vip.');
        setStep('REGISTER');
      }
    } catch (error: any) {
      setServerMessage(error.response?.data?.error || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerMessage('');
    try {
      const res = await api.post(`/portal/${slug}/auth/login`, { telefone: phone, senha });
      login(res.data.token, res.data.cliente);
      navigate(`/portal/${slug}/home`);
    } catch (error: any) {
      setServerMessage(error.response?.data?.error || 'Senha incorreta.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerMessage('');
    try {
      const res = await api.post(`/portal/${slug}/auth/register`, { telefone: phone, senha, nome, email });
      login(res.data.token, res.data.cliente);
      navigate(`/portal/${slug}/home`);
    } catch (error: any) {
      setServerMessage(error.response?.data?.error || 'Falha ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] shadow-[0_0_30px_var(--color-primary)] mb-6">
            <Sparkles className="text-[var(--color-background)] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-primary)] mb-2 tracking-wide uppercase">Área VIP</h1>
          <p className="text-[var(--color-text)]/60 text-sm">Seu portal exclusivo.</p>
        </div>

        {serverMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-center animate-in fade-in duration-300">
            <p className="text-sm text-[var(--color-primary)] font-medium">{serverMessage}</p>
          </div>
        )}

        <div className="bg-[var(--color-surface)]/80 backdrop-blur-xl border border-[var(--color-primary)]/10 rounded-3xl p-6 shadow-2xl">
          
          {step === 'PHONE' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-[var(--color-text)]/50 uppercase tracking-widest ml-1">Número do Celular</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50 group-focus-within:text-[var(--color-primary)] transition-colors">
                    <Smartphone size={20} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[var(--color-background)]/50 text-lg text-[var(--color-text)] rounded-2xl border border-transparent focus:border-[var(--color-primary)]/50 focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-all outline-none"
                    placeholder="(11) 99999-9999"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <button 
                disabled={loading || phone.length < 10}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Continuar'}
              </button>
            </form>
          )}

          {step === 'PASSWORD' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-[var(--color-text)]/50 uppercase tracking-widest ml-1">Sua Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50 group-focus-within:text-[var(--color-primary)] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[var(--color-background)]/50 text-lg text-[var(--color-text)] rounded-2xl border border-transparent focus:border-[var(--color-primary)]/50 focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-all outline-none"
                    placeholder="••••••••"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <button 
                disabled={loading}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar no Portal'}
              </button>
              <button type="button" onClick={() => setStep('PHONE')} className="w-full text-[var(--color-text)]/40 text-xs hover:text-[var(--color-primary)] transition-colors">
                Usar outro número
              </button>
            </form>
          )}

          {step === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in slide-in-from-right-8 duration-500">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50 group-focus-within:text-[var(--color-primary)] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)]/50 text-sm text-[var(--color-text)] rounded-xl border border-transparent focus:border-[var(--color-primary)]/50 focus:bg-[var(--color-surface)] outline-none transition-all"
                  placeholder="Nome Completo"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50 group-focus-within:text-[var(--color-primary)] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)]/50 text-sm text-[var(--color-text)] rounded-xl border border-transparent focus:border-[var(--color-primary)]/50 focus:bg-[var(--color-surface)] outline-none transition-all"
                  placeholder="E-mail (Opcional)"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-primary)]/50 group-focus-within:text-[var(--color-primary)] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--color-background)]/50 text-sm text-[var(--color-text)] rounded-xl border border-transparent focus:border-[var(--color-primary)]/50 focus:bg-[var(--color-surface)] outline-none transition-all"
                  placeholder="Criar uma Senha Segura"
                  required
                />
              </div>

              <button 
                disabled={loading}
                className="w-full py-4 mt-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-[var(--color-background)] font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar Cadastro'}
                {!loading && <ChevronRight size={18} />}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
