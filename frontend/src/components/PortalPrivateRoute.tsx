import { Navigate, Outlet } from 'react-router-dom'
import { usePortalAuth } from '../contexts/PortalAuthContext'

export function PortalPrivateRoute() {
  const { token, cliente } = usePortalAuth()

  // No React Strict mode, é melhor verificar diretamente no localStorage
  // ou suportar loading state pra evitar redirect glitch, mas isso serve pro PWA
  const hasToken = token || localStorage.getItem('portal_token')

  if (!hasToken) {
    return <Navigate to="/portal/login" replace />
  }

  return <Outlet />
}
