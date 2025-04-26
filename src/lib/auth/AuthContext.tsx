'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { User } from './types'
import { SessionProvider } from 'next-auth/react'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Token ellenőrzése és felhasználó betöltése
    const token = Cookies.get('token')
    if (token) {
      // TODO: Token validálása a szerverrel
      const userData = JSON.parse(Cookies.get('user') || 'null')
      if (userData) {
        setUser(userData)
      }
    }
    setLoading(false)
  }, [])

  const login = (token: string, userData: User) => {
    // Token és user adatok mentése cookie-ba
    Cookies.set('token', token, { 
      expires: 1, // 1 nap
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    Cookies.set('user', JSON.stringify(userData), { 
      expires: 1,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    setUser(userData)
  }

  const logout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    setUser(null)
    router.push('/auth/login')
  }

  return (
    <SessionProvider>
      <AuthContext.Provider value={{ user, loading, login, logout }}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
