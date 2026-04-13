import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { PortalPrivateRoute } from './components/PortalPrivateRoute'

import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import { Clientes } from './pages/Clientes/Clientes'
import { Profissionais } from './pages/Profissionais/Profissionais'
import { Catalogo } from './pages/Catalogo/Catalogo'
import { Agenda } from './pages/Agenda/Agenda'
import Transacoes from './pages/Transacoes/Transacoes'
import { Comissoes } from './pages/Comissoes/Comissoes'
import Assinaturas from './pages/Assinaturas/Assinaturas'
import Layout from './components/Layout/Layout'

// PWA:
import LoginPortal from './pages/Portal/Login/LoginPortal'
import HomePortal from './pages/Portal/Home/HomePortal'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ===== ROTAS PWA / PORTAL DO CLIENTE ===== */}
          <Route path="/portal/login" element={<LoginPortal />} />
          
          <Route element={<PortalPrivateRoute />}>
            <Route path="/portal" element={<Navigate to="/portal/home" />} />
            <Route path="/portal/home" element={<HomePortal />} />
          </Route>
          {/* ========================================= */}

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
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}