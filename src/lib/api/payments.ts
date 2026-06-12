/**
 * Payment Service API Client
 *
 * All calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend Payment microservice (mounted at /api/payments).
 * No dynamic route segments are used on the client; identifiers are passed
 * via query string.
 *
 * Backend endpoints:
 *  - POST   /payments                (Education Manager) body { studentId, amount, label, dueDate }
 *  - GET    /payments                (Education Manager / Student — students see only their own)
 *  - GET    /payments/:id            (Education Manager / Student)
 *  - PATCH  /payments/:id/pay        (Education Manager) mark as paid
 *  - POST   /payments/:id/remind     (Education Manager) send a reminder (triggers Notification svc)
 *  - GET    /payments/:id/reminders  (Education Manager) ReminderLog entries
 *  - PUT    /payments/:id            (Education Manager)
 *  - DELETE /payments/:id            (Education Manager)
 */

import { apiClient } from "./client"
import type {
  Payment,
  PaymentFormData,
  PaymentQueryParams,
  PaymentsListResponse,
  ReminderLog,
} from "@/types/payment"

const PAYMENTS_BASE = "/api/payments"

export interface PaymentApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

// The backend may return either a bare array or { payments: [...], total }.
function normalizePayments(data: unknown): PaymentsListResponse {
  if (Array.isArray(data)) return { payments: data as Payment[] }
  const obj = (data ?? {}) as Record<string, unknown>
  return {
    payments: Array.isArray(obj.payments) ? (obj.payments as Payment[]) : [],
    total: typeof obj.total === "number" ? obj.total : undefined,
  }
}

function normalizeReminders(data: unknown): ReminderLog[] {
  if (Array.isArray(data)) return data as ReminderLog[]
  const obj = (data ?? {}) as Record<string, unknown>
  if (Array.isArray(obj.reminders)) return obj.reminders as ReminderLog[]
  return []
}

function unwrapPayment(data: unknown): Payment | undefined {
  if (!data) return undefined
  const obj = data as Record<string, unknown>
  if (obj.payment) return obj.payment as Payment
  if (obj._id) return obj as unknown as Payment
  return undefined
}

export async function getPaymentsApi(
  params?: PaymentQueryParams
): Promise<PaymentApiResult<PaymentsListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.status && params.status !== "all") searchParams.set("status", params.status)
  if (params?.studentId) searchParams.set("studentId", params.studentId)
  const query = searchParams.toString()
  const endpoint = query ? `${PAYMENTS_BASE}?${query}` : PAYMENTS_BASE

  const response = await apiClient.get<unknown>(endpoint)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizePayments(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getPaymentApi(paymentId: string): Promise<PaymentApiResult<Payment>> {
  const response = await apiClient.get<unknown>(
    `${PAYMENTS_BASE}?id=${encodeURIComponent(paymentId)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : unwrapPayment(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function createPaymentApi(data: PaymentFormData): Promise<PaymentApiResult<Payment>> {
  const response = await apiClient.post<unknown>(PAYMENTS_BASE, data)
  return {
    success: !response.error,
    data: response.error ? undefined : unwrapPayment(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function updatePaymentApi(
  paymentId: string,
  data: Partial<PaymentFormData>
): Promise<PaymentApiResult<Payment>> {
  const response = await apiClient.put<unknown>(
    `${PAYMENTS_BASE}?id=${encodeURIComponent(paymentId)}`,
    data
  )
  return {
    success: !response.error,
    data: response.error ? undefined : unwrapPayment(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function deletePaymentApi(paymentId: string): Promise<PaymentApiResult> {
  const response = await apiClient.delete(`${PAYMENTS_BASE}?id=${encodeURIComponent(paymentId)}`)
  return {
    success: !response.error,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function markPaymentPaidApi(paymentId: string): Promise<PaymentApiResult<Payment>> {
  const response = await apiClient.patch<unknown>(
    `${PAYMENTS_BASE}/pay?id=${encodeURIComponent(paymentId)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : unwrapPayment(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Triggers a reminder notification for the student via the Notification service.
export async function sendPaymentReminderApi(paymentId: string): Promise<PaymentApiResult> {
  const response = await apiClient.post<unknown>(
    `${PAYMENTS_BASE}/remind?id=${encodeURIComponent(paymentId)}`
  )
  return {
    success: !response.error,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getPaymentRemindersApi(
  paymentId: string
): Promise<PaymentApiResult<ReminderLog[]>> {
  const response = await apiClient.get<unknown>(
    `${PAYMENTS_BASE}/remind?id=${encodeURIComponent(paymentId)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeReminders(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}
