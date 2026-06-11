/**
 * Absence Service API Client
 *
 * All calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend Absence microservice (mounted at /api/absences).
 * No dynamic route segments are used on the client; identifiers are passed
 * via query string or body.
 *
 * Backend endpoints:
 *  - GET   /absences/qr/:scheduleId             (Student) QR of the session starting now
 *  - POST  /absences/scan                       (Student) body { qrToken }
 *  - GET   /absences/my?status=&courseId=       (Student) own absence records
 *  - POST  /absences/:id/justify                (Student) multipart: document + reason
 *  - GET   /absences/justifications/pending     (Teacher / Education Manager)
 *  - PATCH /absences/justifications/:id         (Teacher / Education Manager) body { decision }
 */

import { apiClient } from "./client"
import type {
  Absence,
  AbsencesListResponse,
  AbsenceQueryParams,
  ActiveQRResponse,
  JustificationDecisionRequest,
  JustificationRequest,
  JustificationsListResponse,
  ScanQRRequest,
  ScanQRResponse,
  SessionQRCode,
} from "@/types/absence"

const ATTENDANCE_BASE = "/api/attendance"
const ABSENCES_BASE = "/api/absences"
const JUSTIFICATIONS_BASE = "/api/justifications"

export interface AbsenceApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

// ---- Response normalization ----------------------------------------------
// The backend may return either a bare array/object or a wrapped payload
// ({ absences: [...] }, { qrCode: {...} }, ...). Normalize both shapes so the
// UI always receives the wrapped form.

function normalizeAbsences(data: unknown): AbsencesListResponse {
  if (Array.isArray(data)) return { absences: data as Absence[] }
  const obj = (data ?? {}) as Record<string, unknown>
  if (Array.isArray(obj.absences)) {
    return { absences: obj.absences as Absence[], total: obj.total as number | undefined }
  }
  return { absences: [] }
}

function normalizeJustifications(data: unknown): JustificationsListResponse {
  if (Array.isArray(data)) return { justifications: data as JustificationRequest[] }
  const obj = (data ?? {}) as Record<string, unknown>
  if (Array.isArray(obj.justifications)) {
    return {
      justifications: obj.justifications as JustificationRequest[],
      total: obj.total as number | undefined,
    }
  }
  return { justifications: [] }
}

function normalizeQR(data: unknown): ActiveQRResponse {
  const obj = (data ?? {}) as Record<string, unknown>
  if (obj.qrCode) return { qrCode: obj.qrCode as SessionQRCode }
  // Bare QR document (has the scannable token at the top level).
  if (typeof obj.token === "string") return { qrCode: obj as unknown as SessionQRCode }
  return { qrCode: null }
}

// ---- Student: QR check-in ----------------------------------------------

// Fetch the QR code of the session currently starting (the backend only
// returns it during the first ~10 minutes of the session).
export async function getActiveQRApi(scheduleId: string): Promise<AbsenceApiResult<ActiveQRResponse>> {
  const response = await apiClient.get<unknown>(
    `${ATTENDANCE_BASE}/active-qr?scheduleId=${encodeURIComponent(scheduleId)}`
  )
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeQR(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Submit a scanned QR token to mark the student present.
export async function scanQRApi(payload: ScanQRRequest): Promise<AbsenceApiResult<ScanQRResponse>> {
  const response = await apiClient.post<ScanQRResponse>(`${ATTENDANCE_BASE}/scan`, payload)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
    status: response.error?.status,
  }
}

// ---- Student: absence records ------------------------------------------

export async function getAbsencesApi(params?: AbsenceQueryParams): Promise<AbsenceApiResult<AbsencesListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.status && params.status !== "all") searchParams.set("status", params.status)
  if (params?.courseId) searchParams.set("courseId", params.courseId)

  const query = searchParams.toString()
  const endpoint = query ? `${ABSENCES_BASE}?${query}` : ABSENCES_BASE

  const response = await apiClient.get<unknown>(endpoint)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeAbsences(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Submit a justification (reason + document) for an absence. Uses multipart
// form data, so this calls fetch directly rather than the JSON apiClient.
export async function submitJustificationApi(
  absenceId: string,
  reason: string,
  file: File
): Promise<AbsenceApiResult<{ justification: JustificationRequest }>> {
  const formData = new FormData()
  formData.append("reason", reason)
  formData.append("document", file)

  try {
    const response = await fetch(
      `${ABSENCES_BASE}/justify?id=${encodeURIComponent(absenceId)}`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }
    return { success: true, data, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

// ---- Teacher / Education Manager: review justifications ------------------

// The backend only exposes the PENDING queue (GET /absences/justifications/pending).
export async function getPendingJustificationsApi(): Promise<AbsenceApiResult<JustificationsListResponse>> {
  const response = await apiClient.get<unknown>(JUSTIFICATIONS_BASE)
  return {
    success: !response.error,
    data: response.error ? undefined : normalizeJustifications(response.data),
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Approve or reject a pending justification.
// Body: { decision: "approved" | "rejected", rejectionNote? } — the backend
// requires the `decision` field.
export async function reviewJustificationApi(
  justificationId: string,
  decision: JustificationDecisionRequest
): Promise<AbsenceApiResult<{ justification: JustificationRequest }>> {
  const response = await apiClient.patch<{ justification: JustificationRequest }>(
    `${JUSTIFICATIONS_BASE}?id=${encodeURIComponent(justificationId)}`,
    decision
  )
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
    status: response.error?.status,
  }
}
