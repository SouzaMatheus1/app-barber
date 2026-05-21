import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scissors, Users, BookOpen, DollarSign, LogOut, X, Crown, UserCog, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/agenda', label: 'Agenda', icon: <Calendar size={20} /> },
    { to: '/transacoes', label: 'Transações', icon: <Scissors size={20} /> },
    { to: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
    { to: '/profissionais', label: 'Profissionais', icon: <UserCog size={20} /> },
    { to: '/catalogo', label: 'Catálogo', icon: <BookOpen size={20} /> },
    { to: '/comissoes', label: 'Comissões', icon: <DollarSign size={20} /> },
    { to: '/assinaturas', label: 'Assinaturas', icon: <Crown size={20} /> },
    { to: '/custos', label: 'Custos', icon: <TrendingDown size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[var(--color-surface)] border-r border-[var(--color-primary)]/30 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:static'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-primary)]/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-[var(--color-primary)] tracking-wider uppercase">{ user?.nomeFantasia || 'LambdaBarber' }</span>
          </div>
          <button className="md:hidden text-[var(--color-text)]" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-background)] hover:text-[var(--color-primary)]'}
              `}
              onClick={() => setIsOpen(false)}
            >
              <span className="opacity-80">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-primary)]/30">
          <button
            onClick={logout}
            className="flex items-center w-full gap-3 px-4 py-3 text-[var(--color-text)] transition-colors rounded-lg hover:bg-red-500/10 hover:text-red-500 group border border-transparent hover:border-red-500/30"
          >
            <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
