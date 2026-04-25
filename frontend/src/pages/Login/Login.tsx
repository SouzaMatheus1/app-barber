import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Usa o serviço real do backend
      const response = await authService.login(email, password);

      login(response.token, response.profissional);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] font-sans selection:bg-[var(--color-primary)]/30 p-4">
      <div className="w-full max-w-md px-8 py-10 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-primary)]/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-sm relative overflow-hidden">
        {/* Elementos Decorativos de Luxo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

        <div className="mb-10 text-center relative z-10">
          <h1 className="text-4xl font-serif font-bold text-[var(--color-primary)] tracking-widest mb-2">&lambda; MAT</h1>
          <p className="text-[var(--color-text)]/60 text-sm tracking-widest uppercase">Gestão inteligente</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm text-center animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10 flex flex-col">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-300 placeholder-[var(--color-text)]/30"
              placeholder="exemplo@email.com"
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[var(--color-text)]/80 uppercase tracking-wider">Senha</label>
              <a href="#" className="text-xs text-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors">Esqueceu?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[var(--color-background)] text-[var(--color-text)] rounded-lg border border-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-300 placeholder-[var(--color-text)]/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-8 bg-[var(--color-primary)] text-[var(--color-background)] font-bold rounded-lg uppercase tracking-wider hover:bg-[var(--color-secondary)] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? 'Acessando...' : 'Entrar na Plataforma'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;