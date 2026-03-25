import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'

import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import { Clientes } from './pages/Clientes/Clientes'
import { Profissionais } from './pages/Profissionais/Profissionais'
import { Catalogo } from './pages/Catalogo/Catalogo'
import { Transacoes } from './pages/Transacoes/Transacoes'
import { Comissoes } from './pages/Comissoes/Comissoes'
import Layout from './components/Layout/Layout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
              <Route path="/catalogo" element={<Catalogo />} />
              <Route path="/comissoes" element={<Comissoes />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}