export enum UserRole {
  CENTRAL_ADMIN = "CENTRAL_ADMIN",
  EDUCATION_MANAGER = "EDUCATION_MANAGER",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface JWTPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  iat: number
  exp: number
}

// API Request/Response types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresAt: number
}

export interface Session {
  id: string
  device: string
  browser: string
  ipAddress: string
  location?: string
  lastActive: string
  createdAt: string
  isCurrent: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  password: string
  confirmPassword: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  sessions: Session[]
  sessionsLoading: boolean
  fetchSessions: () => Promise<void>
  revokeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  revokeAllOtherSessions: () => Promise<{ success: boolean; error?: string }>
}
