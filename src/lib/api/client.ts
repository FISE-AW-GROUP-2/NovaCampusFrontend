/**
 * API Client with automatic token refresh and error handling
 * Uses HttpOnly cookies for token storage - cookies are sent automatically
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export interface ApiResponse<T = unknown> {
  data?: T
  error?: {
    message: string
    code?: string
    status?: number
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  private baseUrl: string
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth, ...fetchOptions } = options

    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      credentials: "include", // Include cookies in requests
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config)

      // Handle 401 - attempt token refresh
      if (response.status === 401 && !skipAuth) {
        const refreshed = await this.handleTokenRefresh()
        if (refreshed) {
          // Retry the original request
          return this.request<T>(endpoint, { ...options, skipAuth: true })
        }
        // Refresh failed - return unauthorized error
        return {
          error: {
            message: "Session expired. Please log in again.",
            code: "UNAUTHORIZED",
            status: 401,
          },
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          error: {
            message: errorData.message || `Request failed with status ${response.status}`,
            code: errorData.code,
            status: response.status,
          },
        }
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return { data: undefined as T }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : "Network error",
          code: "NETWORK_ERROR",
        },
      }
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performRefresh()

    const result = await this.refreshPromise
    this.isRefreshing = false
    this.refreshPromise = null

    return result
  }

  private async performRefresh(): Promise<boolean> {
    try {
      // Call our Next.js API route which handles the backend refresh
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })
      return response.ok
    } catch {
      return false
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

// Export singleton instance for external API calls
export const apiClient = new ApiClient(API_BASE_URL)

// Export class for creating new instances
export { ApiClient }
