import { User, UserRole } from "@/types/auth"

/**
 * Check if a user has permission for specific roles
 */
export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

/**
 * Get the default redirect path based on user role
 */
export function getDefaultRedirectPath(role: UserRole): string {
  // Every role lands on "/" — the home page renders the reporting dashboard
  // for the Central Admin and role-specific quick access for everyone else.
  void role
  return "/"
}

/**
 * Check if a route is accessible by a specific role
 */
export function canAccessRoute(pathname: string, role: UserRole): boolean {
  const routeRoleMap: Record<string, UserRole[]> = {
    "/admin": [UserRole.CENTRAL_ADMIN],
    "/academic": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER],
    "/classes": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER],
    "/portal": [UserRole.STUDENT],
    "/reports": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER],
    "/calendar": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER],
    "/settings": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
    "/notifications": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
    "/help": [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
  }

  // Dashboard is accessible to all authenticated users
  if (pathname === "/" || pathname === "/dashboard") {
    return true
  }

  // Find matching route prefix
  for (const [route, roles] of Object.entries(routeRoleMap)) {
    if (pathname.startsWith(route)) {
      return roles.includes(role)
    }
  }

  // Default: allow access to routes not explicitly defined
  return true
}
