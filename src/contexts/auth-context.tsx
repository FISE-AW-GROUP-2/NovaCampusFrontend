"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { User, LoginCredentials, AuthContextType, Session } from "@/types/auth"
import {
  loginApi,
  logoutApi,
  getCurrentUserApi,
  refreshTokenApi,
  forgotPasswordApi,
  resetPasswordApi,
  getSessionsApi,
  revokeSessionApi,
  revokeAllOtherSessionsApi,
} from "@/lib/api/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token refresh interval (14 minutes - before 15 min expiry)
const REFRESH_INTERVAL = 14 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auth routes where we skip the initial auth check
  const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"]
  const isAuthPage = AUTH_ROUTES.some((r) => pathname?.startsWith(r))

  // Clear refresh timer
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  // Set up automatic token refresh
  const setupRefreshTimer = useCallback(() => {
    clearRefreshTimer()
    refreshTimerRef.current = setInterval(async () => {
      const result = await refreshTokenApi()
      if (!result.success) {
        // Refresh failed - logout user
        setUser(null)
        clearRefreshTimer()
        router.push("/login")
      }
    }, REFRESH_INTERVAL)
  }, [clearRefreshTimer, router])

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const result = await refreshTokenApi()
    return result.success
  }, [])

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const result = await getCurrentUserApi()
      if (result.success && result.data) {
        setUser(result.data)
        setupRefreshTimer()
      } else {
        // Try to refresh token
        const refreshed = await refreshToken()
        if (refreshed) {
          const retryResult = await getCurrentUserApi()
          if (retryResult.success && retryResult.data) {
            setUser(retryResult.data)
            setupRefreshTimer()
            return
          }
        }
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [refreshToken, setupRefreshTimer])

  useEffect(() => {
    if (isAuthPage) {
      // Skip auth check on login/forgot-password/reset-password pages
      setIsLoading(false)
      return
    }
    checkAuth()

    // Cleanup on unmount
    return () => {
      clearRefreshTimer()
    }
  }, [checkAuth, clearRefreshTimer, isAuthPage])

  // Login function
  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const result = await loginApi(credentials)
      if (result.success && result.data) {
        setUser(result.data)
        setupRefreshTimer()
        setIsLoading(false)
        const callbackUrl = searchParams?.get("callbackUrl") || "/"
        router.push(callbackUrl)
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch {
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await logoutApi()
    } finally {
      setUser(null)
      setSessions([])
      clearRefreshTimer()
      setIsLoading(false)
      router.push("/login")
    }
  }

  // Forgot password function
  const forgotPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await forgotPasswordApi(email)
    return {
      success: result.success,
      error: result.error,
    }
  }

  // Reset password function
  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await resetPasswordApi(token, password, confirmPassword)
    return {
      success: result.success,
      error: result.error,
    }
  }

  // Fetch sessions function
  const fetchSessions = async (): Promise<void> => {
    setSessionsLoading(true)
    try {
      const result = await getSessionsApi()
      if (result.success && result.data) {
        setSessions(result.data)
      }
    } finally {
      setSessionsLoading(false)
    }
  }

  // Revoke session function
  const revokeSession = async (
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await revokeSessionApi(sessionId)
    if (result.success) {
      // Remove session from local state
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    }
    return {
      success: result.success,
      error: result.error,
    }
  }

  // Revoke all other sessions function
  const revokeAllOtherSessions = async (): Promise<{
    success: boolean
    error?: string
  }> => {
    const result = await revokeAllOtherSessionsApi()
    if (result.success) {
      // Keep only current session
      setSessions((prev) => prev.filter((s) => s.isCurrent))
    }
    return {
      success: result.success,
      error: result.error,
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    sessions,
    sessionsLoading,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
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
