"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/contexts/auth-context"
import {
  getNotificationsApi,
  getSocketTokenApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "@/lib/api/notifications"
import type { AppNotification } from "@/types/notification"

const SOCKET_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_SOCKET_URL || ""

/**
 * Notification inbox state shared by the bell dropdown.
 *
 * - Loads the inbox over REST (proxied through /api/notifications).
 * - Opens a Socket.io connection to the Notification service authenticated
 *   with the JWT (fetched from the same-origin socket-token route because the
 *   cookie is HttpOnly) and prepends "notification" events as they arrive.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getNotificationsApi()
      if (result.success && result.data) {
        setNotifications(result.data.notifications)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
  }, [isAuthenticated, fetchNotifications])

  // Live delivery over Socket.io.
  useEffect(() => {
    if (!isAuthenticated || !SOCKET_URL) return

    let cancelled = false

    getSocketTokenApi().then((result) => {
      if (cancelled || !result.success || !result.data) return

      const socket = io(SOCKET_URL, { auth: { token: result.data } })
      socketRef.current = socket

      socket.on("notification", (payload: AppNotification | { notification?: AppNotification }) => {
        const notification =
          (payload as { notification?: AppNotification }).notification ??
          (payload as AppNotification)
        if (!notification?._id) return
        setNotifications((prev) =>
          prev.some((n) => n._id === notification._id) ? prev : [notification, ...prev]
        )
      })
    })

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated])

  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic update; the inbox is non-critical so failures only log.
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    )
    await markNotificationReadApi(notificationId)
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsReadApi()
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
  }
}
