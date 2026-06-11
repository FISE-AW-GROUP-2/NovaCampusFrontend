/**
 * Absence Service API Client
 *
 * All calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend Absence microservice. No dynamic route segments
 * are used on the client; identifiers are passed via query string or body.
 *
 * Roles:
 *  - Student: scan QR (check-in), view own absence records, submit justifications.
 *  - Teacher / Education Manager: review pending justifications and validate them.
 */

import { apiClient } from "./client"
import type {
  Absence,
  AbsencesListResponse,
  AbsenceQueryParams,
  ActiveQRResponse,
  JustificationRequest,
  JustificationsListResponse,
  JustificationQueryParams,
  JustificationDecisionRequest,
  ScanQRRequest,
  ScanQRResponse,
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

// ---- Student: QR check-in ----------------------------------------------

// Fetch the currently active QR code for a schedule session (shown on the
// student's screen during the first minutes of the session).
export async function getActiveQRApi(scheduleId: string): Promise<AbsenceApiResult<ActiveQRResponse>> {
  const response = await apiClient.get<ActiveQRResponse>(
    `${ATTENDANCE_BASE}/active-qr?scheduleId=${encodeURIComponent(scheduleId)}`
  )
  return {
    success: !response.error,
    data: response.data,
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

  const response = await apiClient.get<AbsencesListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
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

export async function getJustificationsApi(
  params?: JustificationQueryParams
): Promise<AbsenceApiResult<JustificationsListResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.decision && params.decision !== "all") searchParams.set("decision", params.decision)

  const query = searchParams.toString()
  const endpoint = query ? `${JUSTIFICATIONS_BASE}?${query}` : JUSTIFICATIONS_BASE

  const response = await apiClient.get<JustificationsListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
    status: response.error?.status,
  }
}

// Approve or reject a pending justification.
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
