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

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<boolean>
}
