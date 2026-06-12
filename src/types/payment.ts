// Payment Service Types based on the class diagram (CD_Payment)

export type PaymentStatus = "pending" | "paid" | "overdue"

export type ReminderChannel = "email" | "notification"

export interface Payment {
  _id: string
  studentId: string
  campusId?: string
  amount: number
  currency?: string
  label: string
  dueDate: string
  paidDate?: string
  status: PaymentStatus
  createdAt?: string
  // Optional denormalized fields some backends attach for display
  studentName?: string
  studentEmail?: string
}

export interface ReminderLog {
  _id: string
  paymentId: string
  sentAt: string
  channel: ReminderChannel
  aiDraftUsed?: boolean
  messageBody?: string
}

export interface PaymentFormData {
  studentId: string
  amount: number
  currency?: string
  label: string
  dueDate: string
}

export interface PaymentQueryParams {
  status?: PaymentStatus | "all"
  studentId?: string
}

export interface PaymentsListResponse {
  payments: Payment[]
  total?: number
}

export interface RemindersListResponse {
  reminders: ReminderLog[]
}

export const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  paid: {
    label: "Paid",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  overdue: {
    label: "Overdue",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
}

export function formatAmount(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency || "EUR"}`
  }
}
