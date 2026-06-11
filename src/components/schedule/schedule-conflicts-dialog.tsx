"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { getConflictsApi, resolveConflictApi } from "@/lib/api/schedules"
import { getRoomsApi } from "@/lib/api/rooms"
import {
  DayOfWeek,
  DAY_LABELS,
  DAY_ORDER,
  type Schedule,
  type ConflictLog,
  type ConflictResolution,
} from "@/types/schedule"
import type { Room } from "@/types/room"
import { AlertTriangle, CalendarClock, CheckCircle2, DoorClosed } from "lucide-react"

interface ScheduleConflictsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Enriched schedules from the parent, used to describe the affected session.
  schedules: Schedule[]
  // Called after a conflict is resolved so the parent can refresh its list.
  onResolved?: () => void
}

type Filter = "open" | "resolved"

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

export function ScheduleConflictsDialog({
  open,
  onOpenChange,
  schedules,
  onResolved,
}: ScheduleConflictsDialogProps) {
  const { toast } = useToast()

  const [filter, setFilter] = useState<Filter>("open")
  const [conflicts, setConflicts] = useState<ConflictLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // The conflict currently being resolved (drives the resolve sub-form).
  const [resolving, setResolving] = useState<ConflictLog | null>(null)

  const scheduleById = new Map(schedules.map((s) => [s._id, s]))

  const fetchConflicts = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getConflictsApi(filter === "resolved")
      if (result.success && result.data) {
        setConflicts(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load conflicts",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [filter, toast])

  useEffect(() => {
    if (open) fetchConflicts()
  }, [open, fetchConflicts])

  const handleResolved = () => {
    setResolving(null)
    fetchConflicts()
    onResolved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scheduling conflicts</DialogTitle>
          <DialogDescription>
            Room and teacher clashes detected on your sessions. Resolve an open conflict by
            moving the affected session to a free slot.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-7 w-7" />
          </div>
        ) : conflicts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "open" ? "No open conflicts. You're all clear." : "No resolved conflicts yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-1">
            {conflicts.map((c) => {
              const schedule = c.scheduleId ? scheduleById.get(c.scheduleId) : undefined
              const canResolve = filter === "open" && !!schedule
              return (
                <div key={c._id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={c.conflictType === "room" ? "destructive" : "secondary"}
                          className="text-[10px] uppercase"
                        >
                          {c.conflictType === "room" ? (
                            <DoorClosed className="mr-1 h-3 w-3" />
                          ) : (
                            <CalendarClock className="mr-1 h-3 w-3" />
                          )}
                          {c.conflictType} conflict
                        </Badge>
                        {c.resolvedAt && (
                          <Badge variant="outline" className="text-[10px]">
                            Resolved
                          </Badge>
                        )}
                      </div>

                      {schedule ? (
                        <p className="mt-2 text-sm font-medium truncate">
                          {schedule.course
                            ? `${schedule.course.code} — ${schedule.course.name}`
                            : "Session"}
                          <span className="text-muted-foreground font-normal">
                            {" · "}
                            {DAY_LABELS[schedule.dayOfWeek]} {schedule.startTime}–{schedule.endTime}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Detected while creating a session (not saved).
                        </p>
                      )}

                      <p className="mt-1 text-xs text-muted-foreground">
                        Detected {formatDateTime(c.detectedAt)}
                        {c.resolvedAt ? ` · Resolved ${formatDateTime(c.resolvedAt)}` : ""}
                      </p>
                    </div>

                    {canResolve && (
                      <Button size="sm" variant="outline" onClick={() => setResolving(c)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {resolving && resolving.scheduleId && (
        <ResolveConflictDialog
          open={!!resolving}
          onOpenChange={(o) => !o && setResolving(null)}
          schedule={scheduleById.get(resolving.scheduleId)}
          scheduleId={resolving.scheduleId}
          onResolved={handleResolved}
        />
      )}
    </Dialog>
  )
}

interface ResolveConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  schedule?: Schedule
  onResolved: () => void
}

function ResolveConflictDialog({
  open,
  onOpenChange,
  scheduleId,
  schedule,
  onResolved,
}: ResolveConflictDialogProps) {
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill the proposed slot with the session's current values; the teacher
  // changes whichever fields free up the clash. Omitted/unchanged fields fall
  // back to the schedule's values on the backend.
  const [resolution, setResolution] = useState<ConflictResolution>({
    roomId: schedule?.roomId,
    dayOfWeek: schedule?.dayOfWeek,
    startTime: schedule?.startTime,
    endTime: schedule?.endTime,
  })

  useEffect(() => {
    setResolution({
      roomId: schedule?.roomId,
      dayOfWeek: schedule?.dayOfWeek,
      startTime: schedule?.startTime,
      endTime: schedule?.endTime,
    })
    setError(null)
  }, [schedule, open])

  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      const res = await getRoomsApi({ isActive: true })
      if (active && res.success && res.data) setRooms(res.data.rooms)
    })()
    return () => {
      active = false
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (
      resolution.startTime &&
      resolution.endTime &&
      resolution.endTime <= resolution.startTime
    ) {
      setError("End time must be after start time.")
      return
    }

    setIsLoading(true)
    try {
      const result = await resolveConflictApi(scheduleId, resolution)
      if (result.success) {
        toast({
          title: "Conflict resolved",
          description: "The session was moved to a free slot.",
        })
        onResolved()
      } else if (result.status === 409) {
        setError(result.error || "The proposed slot is still busy. Try a different room or time.")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resolve conflict",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Move session to a free slot</DialogTitle>
          <DialogDescription>
            Pick a different room, day or time. We&apos;ll re-check for clashes before applying.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Still conflicting</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="resolve-room">Room</Label>
              <Select
                value={resolution.roomId}
                onValueChange={(value) => setResolution((r) => ({ ...r, roomId: value }))}
              >
                <SelectTrigger id="resolve-room">
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

            <div className="space-y-2">
              <Label htmlFor="resolve-day">Day</Label>
              <Select
                value={resolution.dayOfWeek}
                onValueChange={(value) =>
                  setResolution((r) => ({ ...r, dayOfWeek: value as DayOfWeek }))
                }
              >
                <SelectTrigger id="resolve-day">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resolve-start">Start Time</Label>
                <Input
                  id="resolve-start"
                  type="time"
                  value={resolution.startTime ?? ""}
                  onChange={(e) => setResolution((r) => ({ ...r, startTime: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolve-end">End Time</Label>
                <Input
                  id="resolve-end"
                  type="time"
                  value={resolution.endTime ?? ""}
                  onChange={(e) => setResolution((r) => ({ ...r, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Apply move
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
