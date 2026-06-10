// User Management types (Central Admin) based on the backend user endpoints.
// Backend returns user objects shaped like:
//   { _id, email, role, campusId, profile: { firstName, lastName } }

import { UserRole } from "./auth"

export interface ManagedUser {
  _id: string
  email: string
  role: UserRole
  campusId?: string
  isActive?: boolean
  createdAt?: string
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
  }
}

// Payload for POST /users (requires email, password, campusId per backend).
export interface CreateUserData {
  email: string
  password: string
  campusId: string
  role: UserRole
  firstName?: string
  lastName?: string
  phone?: string
}

// Payload for PUT /users/:id (password optional on update).
export interface UpdateUserData {
  email?: string
  password?: string
  campusId?: string
  role?: UserRole
  firstName?: string
  lastName?: string
  phone?: string
  isActive?: boolean
}

export interface UsersListResponse {
  users: ManagedUser[]
  total: number
}

export interface UserQueryParams {
  search?: string
  role?: UserRole | "all"
  campusId?: string
}

// Helper to render a full name from the profile object.
export function getUserDisplayName(user: ManagedUser): string {
  const first = user.profile?.firstName?.trim() ?? ""
  const last = user.profile?.lastName?.trim() ?? ""
  const full = `${first} ${last}`.trim()
  return full || user.email
}
