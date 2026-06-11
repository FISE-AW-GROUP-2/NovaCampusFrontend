"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DayOfWeek, type Schedule } from "@/types/schedule"
import {
  addDays,
  addMonths,
  isSameDay,
  monthGridDays,
  schedulesOnDate,
  startOfDay,
  startOfWeekMonday,
  weekDays,
} from "@/lib/schedule-occurrences"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"

type ViewMode = "week" | "month"

// Per-weekday accent for quick visual scanning (left border + month chip dot).
const DAY_ACCENT: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "border-l-blue-500",
  [DayOfWeek.TUESDAY]: "border-l-green-500",
  [DayOfWeek.WEDNESDAY]: "border-l-amber-500",
  [DayOfWeek.THURSDAY]: "border-l-rose-500",
  [DayOfWeek.FRIDAY]: "border-l-cyan-500",
  [DayOfWeek.SATURDAY]: "border-l-orange-500",
  [DayOfWeek.SUNDAY]: "border-l-purple-500",
}

const WEEKDAY_HEADINGS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function formatTime(t: string) {
  const [hStr, m] = t.split(":")
  const h = parseInt(hStr, 10)
  if (Number.isNaN(h)) return t
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m ?? "00"} ${period}`
}

// JS Date.getDay() -> our weekday enum, for picking the accent colour.
function dayOfWeekFor(date: Date): DayOfWeek {
  return [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ][date.getDay()]
}

interface ScheduleCalendarProps {
  schedules: Schedule[]
  canManage: boolean
  onEdit: (schedule: Schedule) => void
  onDelete: (schedule: Schedule) => void
}

export function ScheduleCalendar({
  schedules,
  canManage,
  onEdit,
  onDelete,
}: ScheduleCalendarProps) {
  const [view, setView] = useState<ViewMode>("week")
  // The reference date that drives the visible period.
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()))

  const today = startOfDay(new Date())

  const periodLabel = useMemo(() => {
    if (view === "week") {
      const start = startOfWeekMonday(cursor)
      const end = addDays(start, 6)
      const sameMonth = start.getMonth() === end.getMonth()
      const dayMonth = { month: "short", day: "numeric" } as const
      const startStr = start.toLocaleDateString(undefined, dayMonth)
      // When both ends share a month, show just the day for the end date.
      const endStr = sameMonth
        ? String(end.getDate())
        : end.toLocaleDateString(undefined, dayMonth)
      return `${startStr} – ${endStr}, ${end.getFullYear()}`
    }
    return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  }, [view, cursor])

  const goPrev = () => setCursor((c) => (view === "week" ? addDays(c, -7) : addMonths(c, -1)))
  const goNext = () => setCursor((c) => (view === "week" ? addDays(c, 7) : addMonths(c, 1)))
  const goToday = () => setCursor(startOfDay(new Date()))

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Today
          </Button>
          <h3 className="ml-1 text-base font-semibold">{periodLabel}</h3>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "week" ? (
        <WeekView
          cursor={cursor}
          today={today}
          schedules={schedules}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <MonthView
          cursor={cursor}
          today={today}
          schedules={schedules}
          canManage={canManage}
          onEdit={onEdit}
        />
      )}
    </div>
  )
}

interface ViewProps {
  cursor: Date
  today: Date
  schedules: Schedule[]
  canManage: boolean
  onEdit: (schedule: Schedule) => void
}

function WeekView({
  cursor,
  today,
  schedules,
  canManage,
  onEdit,
  onDelete,
}: ViewProps & { onDelete: (schedule: Schedule) => void }) {
  const days = useMemo(() => weekDays(cursor), [cursor])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const items = schedulesOnDate(schedules, day)
        const isToday = isSameDay(day, today)
        return (
          <Card
            key={day.toISOString()}
            className={`flex flex-col gap-3 p-3 ${isToday ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                  {day.getDate()}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {day.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>

            {items.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">No sessions</p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((s) => (
                  <div
                    key={s._id}
                    className={`rounded-lg border border-l-4 ${DAY_ACCENT[s.dayOfWeek]} bg-card p-2.5`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {s.course ? `${s.course.code} — ${s.course.name}` : "Course"}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(s.startTime)} – {formatTime(s.endTime)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {s.room?.name ?? "Room"}
                            {s.room?.building ? ` · ${s.room.building}` : ""}
                          </span>
                        </div>
                        {!s.isActive && (
                          <Badge variant="secondary" className="mt-1.5 text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Session actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(s)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(s)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function MonthView({ cursor, today, schedules, canManage, onEdit }: ViewProps) {
  const days = useMemo(() => monthGridDays(cursor), [cursor])
  const month = cursor.getMonth()

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_HEADINGS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = schedulesOnDate(schedules, day)
          const inMonth = day.getMonth() === month
          const isToday = isSameDay(day, today)
          const visible = items.slice(0, 3)
          const overflow = items.length - visible.length

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[104px] border-b border-r p-1.5 ${
                inMonth ? "" : "bg-muted/30 text-muted-foreground"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-primary font-semibold text-primary-foreground" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {visible.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => canManage && onEdit(s)}
                    disabled={!canManage}
                    title={`${s.course ? `${s.course.code} — ${s.course.name}` : "Course"} · ${formatTime(
                      s.startTime
                    )}–${formatTime(s.endTime)}${s.room?.name ? ` · ${s.room.name}` : ""}`}
                    className={`flex w-full items-center gap-1 truncate rounded border-l-2 ${
                      DAY_ACCENT[s.dayOfWeek]
                    } bg-card px-1.5 py-0.5 text-left text-[11px] ${
                      canManage ? "hover:bg-accent" : "cursor-default"
                    } ${s.isActive ? "" : "opacity-60"}`}
                  >
                    <span className="font-medium text-muted-foreground">{s.startTime}</span>
                    <span className="truncate">
                      {s.course ? s.course.code : "Course"}
                    </span>
                  </button>
                ))}
                {overflow > 0 && (
                  <span className="px-1 text-[10px] text-muted-foreground">+{overflow} more</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
