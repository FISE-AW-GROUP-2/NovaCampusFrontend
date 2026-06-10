// Schedule Service Types based on the class diagram (CD_Schedule)

export enum DayOfWeek {
  MONDAY = "Mon",
  TUESDAY = "Tue",
  WEDNESDAY = "Wed",
  THURSDAY = "Thu",
  FRIDAY = "Fri",
  SATURDAY = "Sat",
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
  // Optional populated relations returned by the backend
  course?: { _id: string; code: string; name: string }
  room?: { _id: string; name: string; building?: string; floor?: number }
  teacher?: { id: string; name: string; email?: string }
}

export interface ScheduleFormData {
  courseId: string
  roomId: string
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

// Conflict information returned on a 409 (room or teacher busy)
export interface ConflictSuggestion {
  roomId?: string
  roomName?: string
  startTime?: string
  endTime?: string
  dayOfWeek?: DayOfWeek
}

export interface ScheduleConflictResponse {
  message: string
  conflictType?: "room" | "teacher"
  suggestions?: ConflictSuggestion[]
}

// API Response types
export interface SchedulesListResponse {
  schedules: Schedule[]
  total: number
}

// Query params
export interface ScheduleQueryParams {
  courseId?: string
  roomId?: string
  teacherId?: string
  dayOfWeek?: DayOfWeek
  isActive?: boolean
}

// Display metadata
export const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
}

export const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
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
    default:
      return null
  }
}
