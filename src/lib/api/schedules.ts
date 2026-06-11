/**
 * Schedule Service API Client
 * Handles all schedule-related API calls.
 *
 * All calls go through same-origin Next.js proxy routes under /api/schedules
 * which forward the HttpOnly JWT to the backend. No dynamic route segments are
 * used on the client; identifiers are passed via query string or body.
 *
 * Teachers manage (create/update/delete) schedules. Students can only view.
 */

import { apiClient } from "./client"
import type {
  Schedule,
  ScheduleFormData,
  SchedulesListResponse,
  ScheduleQueryParams,
  ScheduleConflictResponse,
  ConflictLog,
  ConflictResolution,
  ScheduleSession,
} from "@/types/schedule"

const SCHEDULES_BASE = "/api/schedules"

export interface ScheduleApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
  // Present when the backend returns a 409 room/teacher conflict
  conflict?: ScheduleConflictResponse
}

export async function getSchedulesApi(params?: ScheduleQueryParams) {
  const searchParams = new URLSearchParams()
  if (params?.courseId) searchParams.set("courseId", params.courseId)
  if (params?.dayOfWeek) searchParams.set("dayOfWeek", params.dayOfWeek)
  if (params?.campusId) searchParams.set("campusId", params.campusId)

  const query = searchParams.toString()
  const endpoint = query ? `${SCHEDULES_BASE}?${query}` : SCHEDULES_BASE

  const response = await apiClient.get<SchedulesListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function getScheduleByIdApi(scheduleId: string) {
  const response = await apiClient.get<{ schedule: Schedule }>(
    `${SCHEDULES_BASE}?id=${encodeURIComponent(scheduleId)}`
  )
  return {
    success: !response.error,
    data: response.data?.schedule,
    error: response.error?.message,
  }
}

export async function createScheduleApi(
  data: ScheduleFormData
): Promise<ScheduleApiResult<Schedule>> {
  const response = await apiClient.post<{ schedule: Schedule } & ScheduleConflictResponse>(
    SCHEDULES_BASE,
    data
  )
  // A 409 means a room or teacher conflict was detected by the backend.
  if (response.error?.status === 409) {
    return {
      success: false,
      error: response.error.message,
      status: 409,
    }
  }
  return {
    success: !response.error,
    data: response.data?.schedule,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function updateScheduleApi(
  scheduleId: string,
  data: Partial<ScheduleFormData>
): Promise<ScheduleApiResult<Schedule>> {
  const response = await apiClient.put<{ schedule: Schedule } & ScheduleConflictResponse>(
    SCHEDULES_BASE,
    { id: scheduleId, ...data }
  )
  if (response.error?.status === 409) {
    return {
      success: false,
      error: response.error.message,
      status: 409,
    }
  }
  return {
    success: !response.error,
    data: response.data?.schedule,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function deleteScheduleApi(scheduleId: string): Promise<ScheduleApiResult> {
  const response = await apiClient.delete(
    `${SCHEDULES_BASE}?id=${encodeURIComponent(scheduleId)}`
  )
  return {
    success: !response.error,
    error: response.error?.message,
  }
}

// All roles: the concrete occurrence dates (ISO strings) generated from a
// schedule's recurrence rule between its start and end dates.
export async function getScheduleSessionsApi(scheduleId: string) {
  const response = await apiClient.get<{ sessions: ScheduleSession[] }>(
    `${SCHEDULES_BASE}/sessions?id=${encodeURIComponent(scheduleId)}`
  )
  return {
    success: !response.error,
    data: response.data?.sessions,
    error: response.error?.message,
  }
}

// Teacher only: list conflict logs for the teacher's own schedules.
// Pass resolved to filter to resolved (true) or open (false) conflicts.
export async function getConflictsApi(resolved?: boolean) {
  const endpoint =
    resolved === undefined
      ? `${SCHEDULES_BASE}/conflicts`
      : `${SCHEDULES_BASE}/conflicts?resolved=${resolved}`
  const response = await apiClient.get<{ conflicts: ConflictLog[] }>(endpoint)
  return {
    success: !response.error,
    data: response.data?.conflicts,
    error: response.error?.message,
  }
}

// Teacher only: resolve a schedule's open conflicts by moving it to a free
// room/day/time. Re-runs conflict detection, so it may itself return 409.
export async function resolveConflictApi(
  scheduleId: string,
  resolution: ConflictResolution
): Promise<ScheduleApiResult<Schedule>> {
  const response = await apiClient.patch<{ message: string; schedule: Schedule }>(
    `${SCHEDULES_BASE}/resolve?id=${encodeURIComponent(scheduleId)}`,
    resolution
  )
  if (response.error?.status === 409) {
    return { success: false, error: response.error.message, status: 409 }
  }
  return {
    success: !response.error,
    data: response.data?.schedule,
    error: response.error?.message,
    status: response.error?.status,
  }
}
