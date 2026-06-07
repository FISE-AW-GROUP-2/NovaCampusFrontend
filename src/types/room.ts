// Room Service Types based on the class diagram

export enum RoomType {
  CLASSROOM = "classroom",
  LAB = "lab",
  AMPHITHEATER = "amphitheater",
  MEETING = "meeting",
}

export enum BookingStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export interface Room {
  _id: string
  name: string
  campusId: string
  capacity: number
  type: RoomType
  floor: number
  building: string
  equipment: string[]
  isActive: boolean
  occupancyRate?: number
}

export interface RoomFormData {
  name: string
  campusId?: string
  capacity: number
  type: RoomType
  floor: number
  building: string
  equipment: string[]
  isActive?: boolean
}

export interface RoomBooking {
  _id: string
  roomId: string
  bookedBy: string
  courseId: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  createdAt: string
  // Optional populated relations
  room?: Pick<Room, "_id" | "name" | "building" | "floor">
  course?: { _id: string; code: string; name: string }
}

export interface BookingFormData {
  roomId: string
  courseId: string
  date: string
  startTime: string
  endTime: string
}

// API Response types
export interface RoomsListResponse {
  rooms: Room[]
  total: number
}

export interface AvailableRoomsResponse {
  availableRooms: Room[]
  total: number
}

export interface BookingsListResponse {
  bookings: RoomBooking[]
  total: number
}

// Query params
export interface RoomQueryParams {
  search?: string
  type?: RoomType | "all"
  building?: string
  isActive?: boolean
}

export interface AvailabilityQueryParams {
  date: string
  start: string
  end: string
  campusId?: string
}

// Room type display metadata
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  [RoomType.CLASSROOM]: "Classroom",
  [RoomType.LAB]: "Laboratory",
  [RoomType.AMPHITHEATER]: "Amphitheater",
  [RoomType.MEETING]: "Meeting Room",
}
