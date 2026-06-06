import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"]

// Role-based route permissions
type UserRole = "Central Admin" | "Education Manager" | "Teacher" | "Student"

interface RoutePermission {
  pattern: RegExp
  roles: UserRole[]
}

const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Admin routes - Central Admin only
  { pattern: /^\/admin/, roles: ["Central Admin"] },

  // Academic management - Admin and Education Manager
  { pattern: /^\/academic/, roles: ["Central Admin", "Education Manager"] },

  // Teaching routes - Teachers (and above)
  { pattern: /^\/classes/, roles: ["Central Admin", "Education Manager", "Teacher"] },

  // Course Management routes
  { pattern: /^\/courses\/teacher/, roles: ["Central Admin", "Teacher"] },
  { pattern: /^\/courses\/enrollments/, roles: ["Central Admin", "Education Manager"] },
  { pattern: /^\/courses\/browse/, roles: ["Central Admin", "Student"] },

  // Student portal - Students only
  { pattern: /^\/portal/, roles: ["Student"] },

  // Settings - All authenticated users can access their own settings
  { pattern: /^\/settings/, roles: ["Central Admin", "Education Manager", "Teacher", "Student"] },

  // Reports - Admin and Education Manager
  { pattern: /^\/reports/, roles: ["Central Admin", "Education Manager"] },

  // Calendar - Everyone except students
  { pattern: /^\/calendar/, roles: ["Central Admin", "Education Manager", "Teacher"] },

  // Notifications and help - All users
  { pattern: /^\/notifications/, roles: ["Central Admin", "Education Manager", "Teacher", "Student"] },
  { pattern: /^\/help/, roles: ["Central Admin", "Education Manager", "Teacher", "Student"] },
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

function getRoleFromToken(token: string): UserRole | null {
  try {
    const decoded = jose.decodeJwt(token)
    return decoded.role as UserRole
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jose.decodeJwt(token)
    if (!decoded.exp) return true
    // Add 30 second buffer
    return decoded.exp * 1000 < Date.now() + 30000
  } catch {
    return true
  }
}

function hasRequiredRole(pathname: string, userRole: UserRole): boolean {
  // Dashboard is accessible to all authenticated users
  if (pathname === "/" || pathname === "/dashboard") {
    return true
  }

  // Check route permissions
  for (const permission of ROUTE_PERMISSIONS) {
    if (permission.pattern.test(pathname)) {
      return permission.roles.includes(userRole)
    }
  }

  // Default: allow access to routes not explicitly defined
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and API routes (except auth checks)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") // Static files
  ) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get("access_token")?.value
  const refreshToken = request.cookies.get("refresh_token")?.value

  // Check if user is authenticated
  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken)
  const canRefresh = !!refreshToken && !isTokenExpired(refreshToken)

  // Public routes - allow access
  if (isPublicRoute(pathname)) {
    // If authenticated and trying to access auth routes, redirect to dashboard
    if (isAuthRoute(pathname) && (isAuthenticated || canRefresh)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - check authentication
  if (!isAuthenticated) {
    // If refresh token is valid, the client will handle refresh
    if (canRefresh) {
      // Allow request to proceed, client-side will refresh
      return NextResponse.next()
    }

    // No valid tokens - redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  const userRole = getRoleFromToken(accessToken)
  if (userRole && !hasRequiredRole(pathname, userRole)) {
    // User doesn't have required role - redirect to unauthorized page
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)",
  ],
}
