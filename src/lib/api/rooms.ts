/**
 * Room Service API Client
 * Handles all room and room-booking related API calls.
 *
 * All calls go through same-origin Next.js proxy routes under /api/rooms/*
 * which forward the HttpOnly JWT to the backend. No dynamic route segments
 * are used on the client; identifiers are passed via query string or body.
 */

import { apiClient } from "./client"
import type {
  Room,
  RoomFormData,
  RoomBooking,
  BookingFormData,
  RoomsListResponse,
  AvailableRoomsResponse,
  BookingsListResponse,
  RoomQueryParams,
  AvailabilityQueryParams,
} from "@/types/room"

const ROOMS_BASE = "/api/rooms"

// ==================== Room CRUD (Education Manager / Admin) ====================

export async function getRoomsApi(params?: RoomQueryParams) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.type && params.type !== "all") searchParams.set("type", params.type)
  if (params?.building) searchParams.set("building", params.building)
  if (params?.isActive !== undefined) searchParams.set("isActive", params.isActive.toString())

  const query = searchParams.toString()
  const endpoint = query ? `${ROOMS_BASE}?${query}` : ROOMS_BASE

  const response = await apiClient.get<RoomsListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function getRoomByIdApi(roomId: string) {
  const response = await apiClient.get<{ room: Room }>(
    `${ROOMS_BASE}?id=${encodeURIComponent(roomId)}`
  )
  return {
    success: !response.error,
    data: response.data?.room,
    error: response.error?.message,
  }
}

export async function createRoomApi(data: RoomFormData) {
  const response = await apiClient.post<{ room: Room }>(ROOMS_BASE, data)
  return {
    success: !response.error,
    data: response.data?.room,
    error: response.error?.message,
  }
}

export async function updateRoomApi(roomId: string, data: Partial<RoomFormData>) {
  const response = await apiClient.put<{ room: Room }>(ROOMS_BASE, { id: roomId, ...data })
  return {
    success: !response.error,
    data: response.data?.room,
    error: response.error?.message,
  }
}

export async function deleteRoomApi(roomId: string) {
  const response = await apiClient.delete(`${ROOMS_BASE}?id=${encodeURIComponent(roomId)}`)
  return {
    success: !response.error,
    error: response.error?.message,
  }
}

// ==================== Availability (Teacher) ====================
// GET /api/rooms/availability?date=&start=&end=&campusId=
export async function getAvailableRoomsApi(params: AvailabilityQueryParams) {
  const searchParams = new URLSearchParams()
  searchParams.set("date", params.date)
  searchParams.set("start", params.start)
  searchParams.set("end", params.end)
  if (params.campusId) searchParams.set("campusId", params.campusId)

  const response = await apiClient.get<AvailableRoomsResponse>(
    `${ROOMS_BASE}/availability?${searchParams.toString()}`
  )
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

// ==================== Bookings (Teacher) ====================

// POST /api/rooms/book { roomId, date, startTime, endTime, courseId }
// The proxy forwards this to the backend POST /rooms/:id/book using roomId.
export async function bookRoomApi(data: BookingFormData) {
  const response = await apiClient.post<{ booking: RoomBooking }>(`${ROOMS_BASE}/book`, data)
  return {
    success: !response.error,
    data: response.data?.booking,
    error: response.error?.message,
    status: response.error?.status,
  }
}

export async function getBookingsApi(params?: { roomId?: string; courseId?: string; date?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.roomId) searchParams.set("roomId", params.roomId)
  if (params?.courseId) searchParams.set("courseId", params.courseId)
  if (params?.date) searchParams.set("date", params.date)

  const query = searchParams.toString()
  const endpoint = query ? `${ROOMS_BASE}/bookings?${query}` : `${ROOMS_BASE}/bookings`

  const response = await apiClient.get<BookingsListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function cancelBookingApi(bookingId: string) {
  const response = await apiClient.patch<{ booking: RoomBooking }>(
    `${ROOMS_BASE}/bookings`,
    { bookingId, status: "cancelled" }
  )
  return {
    success: !response.error,
    data: response.data?.booking,
    error: response.error?.message,
  }
}
