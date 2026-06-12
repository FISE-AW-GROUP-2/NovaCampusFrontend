// Notification Service Types based on the class diagram (CD_Notification)

export type NotificationType = "grade" | "absence" | "schedule" | "payment" | "system"

export interface AppNotification {
  _id: string
  recipientId: string
  campusId?: string
  type: NotificationType
  message: string
  referenceId?: string
  referenceService?: string
  read: boolean
  createdAt: string
}

export interface NotificationsListResponse {
  notifications: AppNotification[]
  unreadCount?: number
  total?: number
}

export const notificationTypeConfig: Record<NotificationType, { label: string; color: string }> = {
  grade: { label: "Grade", color: "text-blue-600 dark:text-blue-400" },
  absence: { label: "Absence", color: "text-red-600 dark:text-red-400" },
  schedule: { label: "Schedule", color: "text-amber-600 dark:text-amber-400" },
  payment: { label: "Payment", color: "text-green-600 dark:text-green-400" },
  system: { label: "System", color: "text-muted-foreground" },
}
