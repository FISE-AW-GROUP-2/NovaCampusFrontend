import * as jose from "jose"
import { User, UserRole, LoginCredentials, JWTPayload } from "@/types/auth"
import { JWT_SECRET, TOKEN_STORAGE_KEY } from "@/lib/constants"

// Mock user database - replace with real API calls in production
const mockUsers: (User & { password: string })[] = [
  {
    id: "1",
    email: "admin@school.edu",
    password: "admin123",
    name: "Admin User",
    role: UserRole.CENTRAL_ADMIN,
    avatar: "/avatars/avatar-1.jpg",
  },
  {
    id: "2",
    email: "manager@school.edu",
    password: "manager123",
    name: "Dr. Sarah Johnson",
    role: UserRole.EDUCATION_MANAGER,
    avatar: "/avatars/avatar-2.jpg",
  },
  {
    id: "3",
    email: "teacher@school.edu",
    password: "teacher123",
    name: "Mr. John Smith",
    role: UserRole.TEACHER,
    avatar: "/avatars/avatar-3.jpg",
  },
  {
    id: "4",
    email: "student@school.edu",
    password: "student123",
    name: "Alice Brown",
    role: UserRole.STUDENT,
    avatar: "/avatars/avatar-4.jpg",
  },
]

// Create a secret key for JWT signing
const secretKey = new TextEncoder().encode(JWT_SECRET)

/**
 * Generate a JWT token for a user
 * In production, this would be done on the server
 */
export async function generateToken(user: User): Promise<string> {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  const token = await new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey)

  return token
}

/**
 * Verify and decode a JWT token
 * Returns the user payload if valid, null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * Store token in localStorage
 * In production, consider httpOnly cookies for better security
 */
export function storeToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/**
 * Retrieve token from localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }
  return null
}

/**
 * Remove token from localStorage
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/**
 * Mock login function - validates credentials and returns user with token
 * Replace with actual API call in production:
 * return await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const user = mockUsers.find(
    (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
  )

  if (!user) {
    return { success: false, error: "Invalid email or password" }
  }

  // Create user object without password
  const safeUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  }

  const token = await generateToken(safeUser)
  storeToken(token)

  return { success: true, user: safeUser, token }
}

/**
 * Get current user from stored token
 * Replace with API call in production for token refresh
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken()
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) {
    removeToken()
    return null
  }

  // Check if token is expired
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    removeToken()
    return null
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  }
}

/**
 * Logout user - clear token
 * Replace with API call in production to invalidate token server-side
 */
export function logoutUser(): void {
  removeToken()
}

/**
 * Check if a user has permission for a specific role
 */
export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

/**
 * Get mock users for demo purposes (login page)
 */
export function getMockUsers(): { email: string; role: string }[] {
  return mockUsers.map((u) => ({ email: u.email, role: u.role }))
}
