import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface Cliente {
  id: number
  nome: string
  telefone: string
}

interface PortalAuthContextData {
  cliente: Cliente | null
  token: string | null
  login: (token: string, cliente: Cliente) => void
  logout: () => void
}

const PortalAuthContext = createContext({} as PortalAuthContextData)

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('portal_token')
    const savedCliente = localStorage.getItem('portal_cliente')
    if (savedToken && savedCliente) {
      setToken(savedToken)
      setCliente(JSON.parse(savedCliente))
    }
  }, [])

  function login(token: string, cliente: Cliente) {
    localStorage.setItem('portal_token', token)
    localStorage.setItem('portal_cliente', JSON.stringify(cliente))
    setToken(token)
    setCliente(cliente)
  }

  function logout() {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_cliente')
    setToken(null)
    setCliente(null)
  }

  return (
    <PortalAuthContext.Provider value={{ cliente, token, login, logout }}>
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  return useContext(PortalAuthContext)
}
