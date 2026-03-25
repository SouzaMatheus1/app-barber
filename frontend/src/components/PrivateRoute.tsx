// componente para proteger rotas
// se nao tiver lgoado redireciona para login
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  adminOnly?: boolean
}

export function PrivateRoute({ adminOnly = false }: Props) {
  const { token, isAdmin } = useAuth()

  if (!token)
    return <Navigate to="/login" replace />
  
  if (adminOnly && !isAdmin)
    return <Navigate to="/dashboard" replace />

  return <Outlet /> // renderiza a página filha da rota protegida.
}