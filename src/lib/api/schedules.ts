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
  if (params?.roomId) searchParams.set("roomId", params.roomId)
  if (params?.teacherId) searchParams.set("teacherId", params.teacherId)
  if (params?.dayOfWeek) searchParams.set("dayOfWeek", params.dayOfWeek)
  if (params?.isActive !== undefined) searchParams.set("isActive", params.isActive.toString())

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
