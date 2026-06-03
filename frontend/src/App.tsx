import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PortalAuthProvider } from './contexts/PortalAuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { PortalPrivateRoute } from './components/PortalPrivateRoute'
import { useTheme } from './hooks/useTheme'

import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import { Clientes } from './pages/Clientes/Clientes'
import { Profissionais } from './pages/Profissionais/Profissionais'
import { Catalogo } from './pages/Catalogo/Catalogo'
import Transacoes from './pages/Transacoes/Transacoes'
import { Comissoes } from './pages/Comissoes/Comissoes'
import Assinaturas from './pages/Assinaturas/Assinaturas'
import Custos from './pages/Custos/Custos'
import Layout from './components/Layout/Layout'
import { Agenda } from './pages/Agenda/Agenda'
import LoginPortal from './pages/Portal/Login/LoginPortal'
import PortalHome from './pages/Portal/Home/PortalHome'
import PortalAgendar from './pages/Portal/Agendar/PortalAgendar'

function ThemeLoader() {
  useTheme();
  return null;
}

function PortalRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/${slug}/login`} replace />;
}

function PortalLayoutWrapper() {
  const { slug } = useParams<{ slug: string }>();
  
  useEffect(() => {
    if (slug) {
      localStorage.setItem('@lambda:last_slug', slug);
    }
  }, [slug]);

  return <Outlet />;
}

function PortalIndex() {
  const savedSlug = localStorage.getItem('@lambda:last_slug');
  
  if (savedSlug) {
    return <Navigate to={`/${savedSlug}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-6 text-center">
      <h1 className="text-xl font-bold mb-2 text-zinc-200">Portal do Cliente</h1>
      <p className="text-sm">Por favor, acesse utilizando o link direto da sua barbearia (ex: portal.localhost/sua-barbearia).</p>
    </div>
  );
}

export default function App() {
  const hostname = window.location.hostname;
  const isPortal = hostname.startsWith('portal');

  if (isPortal) {
    return (
      <PortalAuthProvider>
        <BrowserRouter>
          <ThemeLoader />
          <Routes>
            <Route element={<PortalLayoutWrapper />}>
              <Route path="/:slug/login" element={<LoginPortal />} />
              <Route path="/:slug" element={<PortalRedirect />} />
              <Route element={<PortalPrivateRoute />}>
                 <Route path="/:slug/home" element={<PortalHome />} />
                 <Route path="/:slug/agendar" element={<PortalAgendar />} />
              </Route>
            </Route>
            <Route path="/" element={<PortalIndex />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PortalAuthProvider>
    );
  }

  // Admin / default panel
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeLoader />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/transacoes" element={<Transacoes />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute adminOnly />}>
            <Route element={<Layout />}>
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/comissoes" element={<Comissoes />} />
              <Route path="/assinaturas" element={<Assinaturas />} />
              <Route path="/custos" element={<Custos />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}