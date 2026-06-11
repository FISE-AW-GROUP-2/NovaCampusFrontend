/**
 * Expands recurring schedules into concrete calendar dates.
 *
 * A Schedule stores a weekday + recurrence rule + a [startDate, endDate] span
 * rather than individual dates. To render a real calendar we need to know which
 * actual dates a session lands on. This mirrors the backend's
 * Schedule.getSessionDates() logic (weekly / bi-weekly / once).
 */

import { DayOfWeek, Recurrence, type Schedule } from "@/types/schedule"

// Our weekday enum -> JS Date.getDay() (Sun=0 ... Sat=6)
const DAY_TO_JS: Record<DayOfWeek, number> = {
  [DayOfWeek.SUNDAY]: 0,
  [DayOfWeek.MONDAY]: 1,
  [DayOfWeek.TUESDAY]: 2,
  [DayOfWeek.WEDNESDAY]: 3,
  [DayOfWeek.THURSDAY]: 4,
  [DayOfWeek.FRIDAY]: 5,
  [DayOfWeek.SATURDAY]: 6,
}

// Parse a stored date (full ISO or "YYYY-MM-DD") as a local midnight Date,
// avoiding the UTC-vs-local off-by-one day shift.
function toLocalDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// The first date on/after startDate that falls on the schedule's weekday.
function firstOccurrence(start: Date, targetJsDay: number): Date {
  const cursor = new Date(start)
  let guard = 0
  while (cursor.getDay() !== targetJsDay && guard < 7) {
    cursor.setDate(cursor.getDate() + 1)
    guard += 1
  }
  return cursor
}

/**
 * Does this schedule have a session on the given calendar date, honouring its
 * recurrence rule and active span?
 */
export function scheduleOccursOn(schedule: Schedule, date: Date): boolean {
  const target = DAY_TO_JS[schedule.dayOfWeek]
  if (target === undefined) return false

  const day = startOfDay(date)
  if (day.getDay() !== target) return false

  const start = toLocalDate(schedule.startDate)
  const end = toLocalDate(schedule.endDate)
  if (!start || !end) return false
  if (day < start || day > end) return false

  const first = firstOccurrence(start, target)
  if (day < first) return false

  const weeksDiff = Math.round((day.getTime() - first.getTime()) / (7 * MS_PER_DAY))

  switch (schedule.recurrence) {
    case Recurrence.WEEKLY:
      return true
    case Recurrence.BI_WEEKLY:
      return weeksDiff % 2 === 0
    case Recurrence.ONCE:
      return weeksDiff === 0
    default:
      return true
  }
}

/**
 * The first concrete session date for a (weekday, range) combination, or null
 * if the range contains no matching weekday. Useful to validate that a schedule
 * will actually produce at least one session — the first occurrence is included
 * by every recurrence rule (weekly / bi-weekly / once).
 */
export function firstSessionDate(
  dayOfWeek: DayOfWeek,
  startDate: string,
  endDate: string
): Date | null {
  const start = toLocalDate(startDate)
  const end = toLocalDate(endDate)
  const target = DAY_TO_JS[dayOfWeek]
  if (!start || !end || target === undefined) return null
  const first = firstOccurrence(start, target)
  return first <= end ? first : null
}

// All schedules that have a session on the given date, sorted by start time.
export function schedulesOnDate(schedules: Schedule[], date: Date): Schedule[] {
  return schedules
    .filter((s) => scheduleOccursOn(s, date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// ---- Date-range helpers for the calendar grid ----

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// Monday-based start of the week containing `date`.
export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date)
  const js = d.getDay() // Sun=0..Sat=6
  const diff = js === 0 ? -6 : 1 - js // shift back to Monday
  return addDays(d, diff)
}

// The 7 dates (Mon..Sun) of the week containing `date`.
export function weekDays(date: Date): Date[] {
  const start = startOfWeekMonday(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// The calendar grid (Mon..Sun rows) covering the month of `date`, padded to
// full weeks. Returns whole weeks so the grid is rectangular.
export function monthGridDays(date: Date): Date[] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const gridStart = startOfWeekMonday(firstOfMonth)
  const gridEnd = addDays(startOfWeekMonday(lastOfMonth), 6)
  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d)
  }
  return days
}
