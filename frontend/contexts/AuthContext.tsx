'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * AuthContext - Global Authentication State
 *
 * Architecture Reference: HW3 Section 3.1.2 State Management
 * - React Context API for global state
 * - Manages user authentication state
 * - Provides login/logout functionality
 */

interface User {
  id: string
  username: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))

      // Ensure cookie is set (in case it expired but localStorage persists)
      document.cookie = `auth_token=${storedToken}; path=/; max-age=${30 * 60}; SameSite=Lax`
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Call Next.js API Route (BFF pattern)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Login failed')
      }

      const data = await response.json()

      // Transform backend response to match our User interface
      const user: User = {
        id: data.user_id,
        username: data.username,
        is_admin: data.is_admin,
      }

      setToken(data.access_token)
      setUser(user)

      // Persist to localStorage
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(user))

      // Also set cookie for middleware to read (server-side)
      document.cookie = `auth_token=${data.access_token}; path=/; max-age=${30 * 60}; SameSite=Lax`

      return true
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')

    // Clear cookie
    document.cookie = 'auth_token=; path=/; max-age=0'
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
