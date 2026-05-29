import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <AuthProvider>
      <PortalAuthProvider>
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

          <Route path="/portal/:slug/login" element={<LoginPortal />} />
          <Route element={<PortalPrivateRoute />}>
             <Route path="/portal/:slug/home" element={<PortalHome />} />
             <Route path="/portal/:slug/agendar" element={<PortalAgendar />} />
          </Route>

        </Routes>
      </BrowserRouter>
      </PortalAuthProvider>
    </AuthProvider>
  )
}