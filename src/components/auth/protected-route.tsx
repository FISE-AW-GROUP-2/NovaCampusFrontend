"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, refreshToken } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) return

      if (!isAuthenticated) {
        // Try to refresh token before redirecting
        const refreshed = await refreshToken()
        if (!refreshed) {
          const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`
          router.push(loginUrl)
        }
        return
      }

      // Check role-based access
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/unauthorized")
      }
    }

    checkAccess()
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname, refreshToken])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If roles are specified and user doesn't have required role, don't render
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
