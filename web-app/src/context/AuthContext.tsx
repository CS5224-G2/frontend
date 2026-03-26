import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { loginUser, type AuthUser, type AuthResult, type LoginValues } from '../services/authService'

type AuthContextValue = {
  user: AuthUser | null
  login: (values: LoginValues) => Promise<AuthUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'cyclelink_web_session'

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const session = JSON.parse(raw) as AuthResult
      return session.user ?? null
    } catch {
      return null
    }
  })

  async function login(values: LoginValues): Promise<AuthUser> {
    const result = await loginUser(values)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setUser(result.user)
    return result.user
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(() => ({ user, login, logout }), [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
