"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { User, LoginCredentials, AuthContextType } from "@/types/auth"
import { loginUser, logoutUser, getCurrentUser } from "@/lib/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return !!currentUser
    } catch {
      setUser(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const result = await loginUser(credentials)
      if (result.success && result.user) {
        setUser(result.user)
        router.push("/")
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    router.push("/login")
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
