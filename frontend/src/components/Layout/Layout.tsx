import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const Layout = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#A1A1A1] text-[#000000] font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[var(--color-surface)] border-b border-[var(--color-primary)]/30">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">{user?.nomeFantasia || 'λ MAT'}</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-[var(--color-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#A1A1A1] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
