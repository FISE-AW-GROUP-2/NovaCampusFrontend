"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScheduleFormDialog } from "./schedule-form-dialog"
import { useToast } from "@/hooks/use-toast"
import { getSchedulesApi, deleteScheduleApi } from "@/lib/api/schedules"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import {
  DayOfWeek,
  DAY_LABELS,
  DAY_ORDER,
  RECURRENCE_LABELS,
  type Schedule,
} from "@/types/schedule"
import { Plus, CalendarDays, Clock, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react"

// Color accents per day for quick visual scanning.
const DAY_ACCENT: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "border-l-blue-500",
  [DayOfWeek.TUESDAY]: "border-l-green-500",
  [DayOfWeek.WEDNESDAY]: "border-l-amber-500",
  [DayOfWeek.THURSDAY]: "border-l-rose-500",
  [DayOfWeek.FRIDAY]: "border-l-cyan-500",
  [DayOfWeek.SATURDAY]: "border-l-orange-500",
}

function formatTime(t: string) {
  // Accepts "HH:mm"; returns a 12-hour label.
  const [hStr, m] = t.split(":")
  const h = parseInt(hStr, 10)
  if (Number.isNaN(h)) return t
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m ?? "00"} ${period}`
}

export function ScheduleContent() {
  const { user } = useAuth()
  const { toast } = useToast()

  const canManage =
    user?.role === UserRole.TEACHER || user?.role === UserRole.CENTRAL_ADMIN

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    try {
      // Teachers see only their own sessions; students/admins see all relevant.
      const params =
        user?.role === UserRole.TEACHER && user?.id ? { teacherId: user.id } : undefined
      const result = await getSchedulesApi(params)
      if (result.success && result.data) {
        setSchedules(result.data.schedules)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch schedules",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.role, user?.id, toast])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  // Group schedules by day and sort by start time within each day.
  const byDay = useMemo(() => {
    const map: Record<DayOfWeek, Schedule[]> = {
      [DayOfWeek.MONDAY]: [],
      [DayOfWeek.TUESDAY]: [],
      [DayOfWeek.WEDNESDAY]: [],
      [DayOfWeek.THURSDAY]: [],
      [DayOfWeek.FRIDAY]: [],
      [DayOfWeek.SATURDAY]: [],
    }
    for (const s of schedules) {
      if (map[s.dayOfWeek]) map[s.dayOfWeek].push(s)
    }
    for (const day of DAY_ORDER) {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return map
  }, [schedules])

  const handleSuccess = (schedule: Schedule) => {
    setSchedules((prev) => {
      const exists = prev.find((s) => s._id === schedule._id)
      return exists ? prev.map((s) => (s._id === schedule._id ? schedule : s)) : [schedule, ...prev]
    })
    setEditing(null)
  }

  const handleEdit = (schedule: Schedule) => {
    setEditing(schedule)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteScheduleApi(deleteTarget._id)
    if (result.success) {
      setSchedules((prev) => prev.filter((s) => s._id !== deleteTarget._id))
      toast({ title: "Session deleted", description: "The session has been removed." })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete session",
        variant: "destructive",
      })
    }
    setDeleteTarget(null)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) setEditing(null)
    setShowForm(open)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {canManage
            ? "Manage your weekly recurring sessions across courses and rooms."
            : "View your weekly class schedule."}
        </p>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sessions scheduled</h3>
          <p className="text-muted-foreground mb-4">
            {canManage
              ? "Get started by scheduling your first session."
              : "There are no sessions on your schedule yet."}
          </p>
          {canManage && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule a Session
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {DAY_ORDER.map((day) => (
            <Card key={day} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {DAY_LABELS[day]}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {byDay[day].length}
                </Badge>
              </div>

              {byDay[day].length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No sessions</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {byDay[day].map((s) => (
                    <div
                      key={s._id}
                      className={`rounded-lg border border-l-4 ${DAY_ACCENT[day]} bg-card p-3`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
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
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {RECURRENCE_LABELS[s.recurrence]}
                            </Badge>
                            {!s.isActive && (
                              <Badge variant="secondary" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                          </div>
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
                              <DropdownMenuItem onClick={() => handleEdit(s)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(s)}
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
          ))}
        </div>
      )}

      {canManage && (
        <ScheduleFormDialog
          open={showForm}
          onOpenChange={handleFormClose}
          schedule={editing}
          onSuccess={handleSuccess}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the session
              {deleteTarget?.course ? ` for ${deleteTarget.course.code}` : ""} on{" "}
              {deleteTarget ? DAY_LABELS[deleteTarget.dayOfWeek] : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
