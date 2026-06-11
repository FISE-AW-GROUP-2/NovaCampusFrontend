// Schedule Service Types based on the class diagram (CD_Schedule)

export enum DayOfWeek {
  MONDAY = "Mon",
  TUESDAY = "Tue",
  WEDNESDAY = "Wed",
  THURSDAY = "Thu",
  FRIDAY = "Fri",
  SATURDAY = "Sat",
  SUNDAY = "Sun",
}

export enum Recurrence {
  WEEKLY = "weekly",
  BI_WEEKLY = "bi-weekly",
  ONCE = "once",
}

export interface Schedule {
  _id: string
  courseId: string
  roomId: string
  teacherId: string
  campusId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  recurrence: Recurrence
  startDate: string
  endDate: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  // The Schedule service stores only ObjectId references and does NOT populate
  // related documents. These are enriched on the client by looking up the
  // separately-fetched courses/rooms collections (see schedule-content).
  course?: { _id: string; code: string; name: string }
  room?: { _id: string; name: string; building?: string; floor?: number }
  teacher?: { id: string; name: string; email?: string }
}

export interface ScheduleFormData {
  courseId: string
  roomId: string
  // teacherId is forced from the authenticated JWT on the backend and ignored
  // if sent; kept optional only so edit forms can round-trip the value.
  teacherId?: string
  campusId?: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  recurrence: Recurrence
  startDate: string
  endDate: string
  isActive?: boolean
}

// Conflict information returned on a 409 (room or teacher busy). The backend
// reports which kind of conflict and the id of the colliding schedule; it does
// not return alternative-slot suggestions.
export interface ScheduleConflictResponse {
  message: string
  conflictType?: "room" | "teacher"
  conflictingScheduleId?: string | null
}

// Proposed slot when resolving a conflict (PATCH /:id/resolve). Any omitted
// field falls back to the schedule's current value.
export interface ConflictResolution {
  roomId?: string
  dayOfWeek?: DayOfWeek
  startTime?: string
  endTime?: string
}

// A persisted conflict-detection record (GET /conflicts).
export interface ConflictLog {
  _id: string
  scheduleId: string | null
  conflictType: "room" | "teacher"
  conflictingScheduleId?: string
  detectedAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  createdAt?: string
  updatedAt?: string
}

// API Response types
export interface SchedulesListResponse {
  schedules: Schedule[]
  // The Schedule service does not return a total count today; kept optional in
  // case it is added later.
  total?: number
}

// Concrete session occurrence dates (GET /:id/sessions) — ISO date strings.
export type ScheduleSession = string

// Query params honoured by the backend list endpoint. Teacher/Student scoping
// is applied server-side from the JWT, so teacherId is not a client param.
export interface ScheduleQueryParams {
  courseId?: string
  dayOfWeek?: DayOfWeek
  campusId?: string
}

// Display metadata
export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
}

export const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  [Recurrence.WEEKLY]: "Weekly",
  [Recurrence.BI_WEEKLY]: "Bi-weekly",
  [Recurrence.ONCE]: "Once",
}

// Map a JS Date.getDay() (0=Sun..6=Sat) to our DayOfWeek enum
export function jsDayToDayOfWeek(jsDay: number): DayOfWeek | null {
  switch (jsDay) {
    case 1:
      return DayOfWeek.MONDAY
    case 2:
      return DayOfWeek.TUESDAY
    case 3:
      return DayOfWeek.WEDNESDAY
    case 4:
      return DayOfWeek.THURSDAY
    case 5:
      return DayOfWeek.FRIDAY
    case 6:
      return DayOfWeek.SATURDAY
    case 0:
      return DayOfWeek.SUNDAY
    default:
      return null
  }
}
