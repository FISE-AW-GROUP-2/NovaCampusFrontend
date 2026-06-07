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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { getCoursesApi } from "@/lib/api/courses"
import { ROOM_TYPE_LABELS, type Room } from "@/types/room"
import type { Course } from "@/types/course"
import { Building2, Calendar, Clock, Users } from "lucide-react"

interface BookRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
  date: string
  startTime: string
  endTime: string
  onBook: (courseId: string) => Promise<void>
  isLoading?: boolean
}

export function BookRoomDialog({
  open,
  onOpenChange,
  room,
  date,
  startTime,
  endTime,
  onBook,
  isLoading,
}: BookRoomDialogProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState("")
  const [isFetchingCourses, setIsFetchingCourses] = useState(false)

  useEffect(() => {
    if (open) {
      setCourseId("")
      fetchCourses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchCourses = async () => {
    setIsFetchingCourses(true)
    try {
      const result = await getCoursesApi({ isActive: true })
      if (result.success && result.data) {
        setCourses(result.data.courses)
      }
    } finally {
      setIsFetchingCourses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return
    await onBook(courseId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Book Room</DialogTitle>
          <DialogDescription>
            Confirm the booking details and select the course this slot is for.
          </DialogDescription>
        </DialogHeader>

        {room && (
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <p className="font-medium">
              {room.name} <span className="text-muted-foreground">· {ROOM_TYPE_LABELS[room.type]}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {room.building}, Floor {room.floor}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {room.capacity} seats
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {startTime}–{endTime}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-2 py-4">
            <Label htmlFor="course">Course</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={isFetchingCourses}>
              <SelectTrigger id="course">
                <SelectValue
                  placeholder={isFetchingCourses ? "Loading courses..." : "Select a course"}
                />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.code} — {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isFetchingCourses && courses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active courses found. Create a course before booking a room.
              </p>
            )}
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
            <Button type="submit" disabled={isLoading || !courseId}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
