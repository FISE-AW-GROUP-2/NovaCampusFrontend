/**
 * User Management API Client (Central Admin)
 * Handles all user CRUD calls.
 *
 * All calls go through the same-origin Next.js proxy route at /api/users which
 * uses the auth-service proxy (proxy.ts) to forward the HttpOnly JWT. No dynamic
 * route segments are used on the client; the user id is passed via query string.
 *
 * Backend endpoints:
 *   POST   /users   (Central Admin)  -> create
 *   GET    /users                     -> getAll
 *   GET    /users/:id                 -> getOne
 *   PUT    /users/:id                 -> update
 *   DELETE /users/:id (Central Admin) -> remove
 */

import { apiClient } from "./client"
import type {
  ManagedUser,
  CreateUserData,
  UpdateUserData,
  UsersListResponse,
  UserQueryParams,
} from "@/types/user"

const USERS_BASE = "/api/users"

// Normalize backend payloads which may return either an array of users or an
// object like { users, total }.
function normalizeUsersList(data: unknown): UsersListResponse {
  if (Array.isArray(data)) {
    return { users: data as ManagedUser[], total: data.length }
  }
  const obj = (data ?? {}) as { users?: ManagedUser[]; total?: number }
  const users = obj.users ?? []
  return { users, total: obj.total ?? users.length }
}

export async function getUsersApi(params?: UserQueryParams) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.role && params.role !== "all") searchParams.set("role", params.role)
  if (params?.campusId) searchParams.set("campusId", params.campusId)

  const query = searchParams.toString()
  const endpoint = query ? `${USERS_BASE}?${query}` : USERS_BASE

  const response = await apiClient.get<unknown>(endpoint)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeUsersList(response.data),
    error: response.error?.message,
  }
}

export async function getUserByIdApi(userId: string) {
  const response = await apiClient.get<{ user: ManagedUser } | ManagedUser>(
    `${USERS_BASE}?id=${encodeURIComponent(userId)}`
  )
  const data = response.data
  const user = data && "user" in (data as object) ? (data as { user: ManagedUser }).user : (data as ManagedUser | undefined)
  return {
    success: !response.error,
    data: user,
    error: response.error?.message,
  }
}

// Maps the flat form data to the backend's expected shape (profile nested).
function toBackendPayload(data: CreateUserData | UpdateUserData) {
  const { firstName, lastName, phone, ...rest } = data as CreateUserData & UpdateUserData
  const payload: Record<string, unknown> = { ...rest }
  if (firstName !== undefined || lastName !== undefined || phone !== undefined) {
    payload.profile = {
      ...(firstName !== undefined ? { firstName } : {}),
      ...(lastName !== undefined ? { lastName } : {}),
      ...(phone !== undefined ? { phone } : {}),
    }
  }
  return payload
}

export async function createUserApi(data: CreateUserData) {
  const response = await apiClient.post<{ user: ManagedUser } | ManagedUser>(
    USERS_BASE,
    toBackendPayload(data)
  )
  const resData = response.data
  const user =
    resData && "user" in (resData as object)
      ? (resData as { user: ManagedUser }).user
      : (resData as ManagedUser | undefined)
  return {
    success: !response.error,
    data: user,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function updateUserApi(userId: string, data: UpdateUserData) {
  const response = await apiClient.put<{ user: ManagedUser } | ManagedUser>(
    `${USERS_BASE}?id=${encodeURIComponent(userId)}`,
    { id: userId, ...toBackendPayload(data) }
  )
  const resData = response.data
  const user =
    resData && "user" in (resData as object)
      ? (resData as { user: ManagedUser }).user
      : (resData as ManagedUser | undefined)
  return {
    success: !response.error,
    data: user,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function deleteUserApi(userId: string) {
  const response = await apiClient.delete(`${USERS_BASE}?id=${encodeURIComponent(userId)}`)
  return {
    success: !response.error,
    error: response.error?.message,
  }
}
