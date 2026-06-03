import { Navigate, Outlet, useParams } from 'react-router-dom'
import { usePortalAuth } from '../contexts/PortalAuthContext'

export function PortalPrivateRoute() {
  const { token } = usePortalAuth()

  // No React Strict mode, é melhor verificar diretamente no localStorage
  // ou suportar loading state pra evitar redirect glitch, mas isso serve pro PWA
  const hasToken = token || localStorage.getItem('portal_token')

  const { slug } = useParams<{ slug: string }>();

  if (!hasToken) {
    return <Navigate to={`/${slug}/login`} replace />
  }

  return <Outlet />
}
