// compartilhar dados, como estado, tema ou usuário autenticado sem usar props manualmente
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { readPersistedJSON } from '../utils/storage';

interface User {
  id: number
  nome: string
  perfil: string
  nomeFantasia?: string
  slug?: string
  tipoEmpresa?: string
}

interface AuthContextData {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = readPersistedJSON<User | null>('user', null)
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(savedUser)
    }
  }, [])

  // Atualiza o <title> do navegador baseado na Empresa
  useEffect(() => {
    if (user?.nomeFantasia) {
      document.title = `${user.nomeFantasia} | λ MAT`;
    } else {
      document.title = 'λ MAT';
    }
  }, [user]);

  function login(token: string, user: User) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
        user,
        token,
        login,
        logout,
        isAdmin: user?.perfil === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}