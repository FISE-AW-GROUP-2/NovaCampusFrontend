"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createScheduleApi, updateScheduleApi } from "@/lib/api/schedules"
import { getCoursesApi } from "@/lib/api/courses"
import { getRoomsApi } from "@/lib/api/rooms"
import { useAuth } from "@/contexts/auth-context"
import {
  DayOfWeek,
  DAY_LABELS,
  DAY_ORDER,
  Recurrence,
  RECURRENCE_LABELS,
  type Schedule,
  type ScheduleFormData,
} from "@/types/schedule"
import type { Course } from "@/types/course"
import type { Room } from "@/types/room"
import { AlertTriangle } from "lucide-react"

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule | null
  onSuccess?: (schedule: Schedule) => void
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

const DEFAULT_FORM: ScheduleFormData = {
  courseId: "",
  roomId: "",
  dayOfWeek: DayOfWeek.MONDAY,
  startTime: "09:00",
  endTime: "10:00",
  recurrence: Recurrence.WEEKLY,
  startDate: todayISO(),
  endDate: todayISO(),
  isActive: true,
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onSuccess,
}: ScheduleFormDialogProps) {
  const [formData, setFormData] = useState<ScheduleFormData>(DEFAULT_FORM)
  const [courses, setCourses] = useState<Course[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conflict, setConflict] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const isEditing = !!schedule

  // Load courses and rooms for the select inputs when the dialog opens.
  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      const [coursesRes, roomsRes] = await Promise.all([
        getCoursesApi({ isActive: true }),
        getRoomsApi({ isActive: true }),
      ])
      if (!active) return
      if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data.courses)
      if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data.rooms)
    })()
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (schedule) {
      setFormData({
        courseId: schedule.courseId,
        roomId: schedule.roomId,
        teacherId: schedule.teacherId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        recurrence: schedule.recurrence,
        startDate: schedule.startDate?.split("T")[0] || todayISO(),
        endDate: schedule.endDate?.split("T")[0] || todayISO(),
        isActive: schedule.isActive,
      })
    } else {
      setFormData(DEFAULT_FORM)
    }
    setConflict(null)
  }, [schedule, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConflict(null)

    if (formData.endTime <= formData.startTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // teacherId and campusId are derived from the authenticated teacher.
      const payload: ScheduleFormData = {
        ...formData,
        teacherId: formData.teacherId || user?.id,
        campusId: formData.campusId || user?.campusId,
      }

      const result = isEditing
        ? await updateScheduleApi(schedule._id, payload)
        : await createScheduleApi(payload)

      if (result.success && result.data) {
        toast({
          title: isEditing ? "Schedule updated" : "Schedule created",
          description: `The session has been ${isEditing ? "updated" : "created"} successfully.`,
        })
        onSuccess?.(result.data)
        onOpenChange(false)
      } else if (result.status === 409) {
        // Room or teacher conflict detected by the backend.
        setConflict(
          result.error ||
            "This room or teacher is already booked for the selected day and time."
        )
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isEditing ? "update" : "create"} schedule`,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Session" : "Schedule a Session"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the recurring session details below."
              : "Assign a course to a room and time slot. Conflicts are checked automatically."}
          </DialogDescription>
        </DialogHeader>

        {conflict && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Scheduling conflict</AlertTitle>
            <AlertDescription>{conflict}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
              >
                <SelectTrigger id="courseId">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No courses available
                    </div>
                  ) : (
                    courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} — {course.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomId">Room</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) => setFormData({ ...formData, roomId: value })}
              >
                <SelectTrigger id="roomId">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No rooms available
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <SelectItem key={room._id} value={room._id}>
                        {room.name}
                        {room.building ? ` · ${room.building}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Day</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dayOfWeek: value as DayOfWeek })
                  }
                >
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_ORDER.map((day) => (
                      <SelectItem key={day} value={day}>
                        {DAY_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurrence</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurrence: value as Recurrence })
                  }
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Recurrence).map((rec) => (
                      <SelectItem key={rec} value={rec}>
                        {RECURRENCE_LABELS[rec]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Active Status</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.courseId || !formData.roomId}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Update Session" : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
