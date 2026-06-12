/**
 * Notification Service API Client (all authenticated roles)
 *
 * REST calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend Notification microservice (mounted at
 * /api/notifications). Live delivery happens over Socket.io — see
 * use-notifications-socket / notification-bell.
 *
 * Backend endpoints:
 *  - GET   /notifications          inbox of the authenticated user
 *  - PATCH /notifications/read-all
 *  - PATCH /notifications/:id/read
 */

import { apiClient } from "./client"
import type { AppNotification, NotificationsListResponse } from "@/types/notification"

const NOTIFICATIONS_BASE = "/api/notifications"

export interface NotificationApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

// The backend may return either a bare array or { notifications, unreadCount }.
function normalizeNotifications(data: unknown): NotificationsListResponse {
  if (Array.isArray(data)) {
    const notifications = data as AppNotification[]
    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }
  }
  const obj = (data ?? {}) as Record<string, unknown>
  const notifications = Array.isArray(obj.notifications)
    ? (obj.notifications as AppNotification[])
    : []
  return {
    notifications,
    unreadCount:
      typeof obj.unreadCount === "number"
        ? obj.unreadCount
        : notifications.filter((n) => !n.read).length,
    total: typeof obj.total === "number" ? obj.total : undefined,
  }
}

export async function getNotificationsApi(): Promise<
  NotificationApiResult<NotificationsListResponse>
> {
  const response = await apiClient.get<unknown>(NOTIFICATIONS_BASE)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeNotifications(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function markNotificationReadApi(
  notificationId: string
): Promise<NotificationApiResult> {
  const response = await apiClient.patch<unknown>(
    `${NOTIFICATIONS_BASE}/read?id=${encodeURIComponent(notificationId)}`
  )
  return {
    success: !response.error,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function markAllNotificationsReadApi(): Promise<NotificationApiResult> {
  const response = await apiClient.patch<unknown>(`${NOTIFICATIONS_BASE}/read-all`)
  return {
    success: !response.error,
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Fetches the JWT from the same-origin route so the Socket.io handshake can
// authenticate (the token is otherwise locked in an HttpOnly cookie).
export async function getSocketTokenApi(): Promise<NotificationApiResult<string>> {
  const response = await apiClient.get<{ token: string }>(
    `${NOTIFICATIONS_BASE}/socket-token`
  )
  return {
    success: !response.error,
    data: response.data?.token,
    error: response.error?.message,
    status: response.error?.status,
  }
}
