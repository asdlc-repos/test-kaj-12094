import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken, isAuthenticated, setUnauthorizedHandler } from '@/api/api'
import { useToast } from './ToastContext'

interface AuthContextValue {
  authenticated: boolean
  setAuthenticated: (v: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isAuthenticated)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const logout = useCallback(() => {
    clearToken()
    setAuthenticated(false)
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthenticated(false)
      showToast('Session expired. Please log in again.', 'error')
      navigate('/login')
    })
  }, [navigate, showToast])

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
