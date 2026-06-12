/**
 * Auth API - Client-side auth functions that call our Next.js API routes
 * These routes proxy to the backend and handle HttpOnly cookie management
 */

import type {
  User,
  LoginCredentials,
  Session,
} from "@/types/auth"

export interface AuthApiResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Login user - sends credentials to our API route which proxies to backend
 */
export async function loginApi(
  credentials: LoginCredentials
): Promise<AuthApiResponse<User>> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Login failed",
      }
    }

    return {
      success: true,
      data: data.user,
    }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Logout user - clears cookies via our API route
 */
export async function logoutApi(): Promise<AuthApiResponse> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || "Logout failed",
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUserApi(): Promise<AuthApiResponse<User>> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      return { success: false }
    }

    const data = await response.json()
    // The backend may return the raw user document ({ _id, profile: {...} })
    // instead of the normalized session shape ({ id, name }); normalize here
    // so the UI (navbar, settings) can always rely on id/name/email/role.
    const raw = (data.user ?? data) as Record<string, unknown>
    const profile = raw.profile as { firstName?: string; lastName?: string } | undefined
    const name =
      (raw.name as string) ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim()
    const user: User = {
      ...(raw as unknown as User),
      id: (raw.id as string) || (raw._id as string),
      name: name || (raw.email as string) || "",
    }
    return {
      success: true,
      data: user,
    }
  } catch {
    return { success: false }
  }
}

/**
 * Refresh access token
 */
export async function refreshTokenApi(): Promise<AuthApiResponse> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })

    return { success: response.ok }
  } catch {
    return { success: false }
  }
}

/**
 * Get students (moved from courses API) - hits the auth namespace endpoint
 */
export async function getStudentsApi(usersession?: string, search?: string): Promise<AuthApiResponse<Array<{ id: string; name: string; email: string }>>> {
  try {
    const searchParams = search ? `?search=${encodeURIComponent(search)}` : ''
    // Default to role 'Student' when usersession is not provided so callers
    // without a session still get student users.
    const effectiveSession = usersession ?? 'Student'
    const path = `/api/users/${encodeURIComponent(effectiveSession)}${searchParams}`
    const response = await fetch(path, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        error: data.error || 'Failed to fetch students',
      }
    }

    const data = await response.json()
    // Backend returns array of user objects with _id, profile.firstName/lastName, email
    // Map to Student interface: { id, name, email }
    const students = Array.isArray(data)
      ? data.map((user: any) => ({
          id: user._id,
          name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : 'Unknown',
          email: user.email,
        }))
      : (data.students || [])

    return {
      success: true,
      data: students,
    }
  } catch {
    return {
      success: false,
      error: 'Network error. Please try again.',
    }
  }
}



/**
 * Request password reset email
 */
export async function forgotPasswordApi(
  email: string
): Promise<AuthApiResponse> {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to send reset email",
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordApi(
  token: string,
  password: string,
  confirmPassword: string
): Promise<AuthApiResponse> {
  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to reset password",
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Get active sessions
 */
export async function getSessionsApi(): Promise<AuthApiResponse<Session[]>> {
  try {
    const response = await fetch("/api/auth/sessions", {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || "Failed to fetch sessions",
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data.sessions,
    }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSessionApi(
  sessionId: string
): Promise<AuthApiResponse> {
  try {
    const response = await fetch(`/api/auth/sessions/${sessionId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || "Failed to revoke session",
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllOtherSessionsApi(): Promise<AuthApiResponse> {
  try {
    const response = await fetch("/api/auth/sessions/revoke-others", {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        success: false,
        error: data.error || "Failed to revoke sessions",
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}
