"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ScheduleFormDialog } from "./schedule-form-dialog"
import { ScheduleConflictsDialog } from "./schedule-conflicts-dialog"
import { ScheduleCalendar } from "./schedule-calendar"
import { useToast } from "@/hooks/use-toast"
import { getSchedulesApi, deleteScheduleApi, getConflictsApi } from "@/lib/api/schedules"
import { getCoursesApi } from "@/lib/api/courses"
import { getRoomsApi } from "@/lib/api/rooms"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import { DAY_LABELS, type Schedule } from "@/types/schedule"
import { Plus, CalendarDays, AlertTriangle } from "lucide-react"

export function ScheduleContent() {
  const { user } = useAuth()
  const { toast } = useToast()

  // The Education Manager owns scheduling: create/update/delete plus conflict
  // resolution. Everyone else (Teacher, Student, Central Admin) is read-only.
  const canManage = user?.role === UserRole.EDUCATION_MANAGER

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  const [showConflicts, setShowConflicts] = useState(false)
  const [openConflictCount, setOpenConflictCount] = useState(0)

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true)
    try {
      // The backend scopes visibility from the JWT (teachers see their own
      // sessions, students see their enrolled courses, managers/admins see all),
      // so no role filter is sent from the client.
      //
      // The Schedule service stores only ObjectId references, so we load courses
      // and rooms alongside the schedules and resolve display names locally.
      const [result, coursesRes, roomsRes] = await Promise.all([
        getSchedulesApi(),
        getCoursesApi(),
        getRoomsApi(),
      ])

      if (result.success && result.data) {
        const courseById = new Map(
          (coursesRes.success && coursesRes.data ? coursesRes.data.courses : []).map((c) => [
            c._id,
            c,
          ])
        )
        const roomById = new Map(
          (roomsRes.success && roomsRes.data ? roomsRes.data.rooms : []).map((r) => [r._id, r])
        )

        const enriched: Schedule[] = result.data.schedules.map((s) => {
          const course = courseById.get(s.courseId)
          const room = roomById.get(s.roomId)
          return {
            ...s,
            course: course
              ? { _id: course._id, code: course.code, name: course.name }
              : s.course,
            room: room
              ? { _id: room._id, name: room.name, building: room.building, floor: room.floor }
              : s.room,
          }
        })
        setSchedules(enriched)
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
  }, [toast])

  // The Education Manager gets an at-a-glance count of unresolved conflicts.
  const fetchOpenConflictCount = useCallback(async () => {
    if (!canManage) return
    const result = await getConflictsApi(false)
    if (result.success && result.data) setOpenConflictCount(result.data.length)
  }, [canManage])

  useEffect(() => {
    fetchSchedules()
    fetchOpenConflictCount()
  }, [fetchSchedules, fetchOpenConflictCount])

  const handleSuccess = () => {
    // Re-fetch so the new/updated session picks up resolved course/room names
    // (the create/update response contains only ObjectId references).
    setEditing(null)
    fetchSchedules()
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
        <div className="flex items-center gap-2">
          {canManage && (
            <Button variant="outline" onClick={() => setShowConflicts(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Conflicts
              {openConflictCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {openConflictCount}
                </Badge>
              )}
            </Button>
          )}
          {canManage && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          )}
        </div>
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
        <ScheduleCalendar
          schedules={schedules}
          canManage={canManage}
          onEdit={handleEdit}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}

      {canManage && (
        <ScheduleFormDialog
          open={showForm}
          onOpenChange={handleFormClose}
          schedule={editing}
          onSuccess={handleSuccess}
        />
      )}

      {canManage && (
        <ScheduleConflictsDialog
          open={showConflicts}
          onOpenChange={setShowConflicts}
          schedules={schedules}
          onResolved={() => {
            // A resolved conflict moves a session, so refresh both views.
            fetchSchedules()
            fetchOpenConflictCount()
          }}
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
