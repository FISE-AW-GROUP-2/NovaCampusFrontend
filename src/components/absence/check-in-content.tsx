"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { getSchedulesApi } from "@/lib/api/schedules"
import { getCoursesApi } from "@/lib/api/courses"
import { getActiveQRApi, scanQRApi } from "@/lib/api/absences"
import {
  DayOfWeek,
  jsDayToDayOfWeek,
  type Schedule,
} from "@/types/schedule"
import type { SessionQRCode } from "@/types/absence"
import type { Course } from "@/types/course"
import { CalendarClock, CheckCircle2, Clock, QrCode, AlertCircle } from "lucide-react"

// The QR check-in window: a session's QR is scannable for the first N minutes
// after its start time (the diagram uses ~15 min validity).
const CHECKIN_WINDOW_MINUTES = 10

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

interface SessionState {
  schedule: Schedule
  courseLabel: string
  // minutes until the session starts (negative if already started)
  minutesFromStart: number
  isOpen: boolean // within the check-in window now
}

export function CheckInContent() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionState[]>([])
  const [now, setNow] = useState(() => new Date())

  // Per-session QR + check-in state
  const [activeQR, setActiveQR] = useState<SessionQRCode | null>(null)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState<Record<string, boolean>>({})

  // Tick every 30s so the open/closed window stays current.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const loadTodaysSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const today = jsDayToDayOfWeek(new Date().getDay())
      const [schedRes, courseRes] = await Promise.all([
        getSchedulesApi(today ? { dayOfWeek: today } : undefined),
        getCoursesApi(),
      ])

      const courseMap = new Map<string, Course>()
      if (courseRes.success && courseRes.data) {
        for (const c of courseRes.data.courses) courseMap.set(c._id, c)
      }

      const schedules = schedRes.success && schedRes.data ? schedRes.data.schedules : []
      const todayKey = today
      const built: SessionState[] = schedules
        .filter((s) => (todayKey ? s.dayOfWeek === todayKey : true) && s.isActive)
        .map((s) => {
          const course = courseMap.get(s.courseId)
          return {
            schedule: s,
            courseLabel: course
              ? `${course.code} — ${course.name}`
              : s.course
                ? `${s.course.code} — ${s.course.name}`
                : "Course",
            minutesFromStart: 0,
            isOpen: false,
          }
        })
        .sort((a, b) => timeToMinutes(a.schedule.startTime) - timeToMinutes(b.schedule.startTime))

      setSessions(built)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load today's sessions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadTodaysSessions()
  }, [loadTodaysSessions])

  // Recompute open windows whenever time changes.
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const decorated = sessions.map((s) => {
    const start = timeToMinutes(s.schedule.startTime)
    const minutesFromStart = nowMinutes - start
    const isOpen = minutesFromStart >= 0 && minutesFromStart <= CHECKIN_WINDOW_MINUTES
    return { ...s, minutesFromStart, isOpen }
  })

  const handleShowQR = async (scheduleId: string) => {
    setSelectedScheduleId(scheduleId)
    setActiveQR(null)
    setQrLoading(true)
    try {
      const result = await getActiveQRApi(scheduleId)
      if (result.success && result.data?.qrCode) {
        setActiveQR(result.data.qrCode)
      } else {
        toast({
          title: "No active QR code",
          description:
            result.error || "The check-in window for this session is not open yet.",
          variant: "destructive",
        })
      }
    } finally {
      setQrLoading(false)
    }
  }

  const handleCheckIn = async (scheduleId: string) => {
    if (!activeQR) return
    setCheckingIn(true)
    try {
      const result = await scanQRApi({ qrToken: activeQR.token })
      if (result.success) {
        setCheckedIn((prev) => ({ ...prev, [scheduleId]: true }))
        toast({
          title: "You are marked present",
          description: result.data?.message || "Attendance recorded successfully.",
        })
      } else if (result.status === 409) {
        setCheckedIn((prev) => ({ ...prev, [scheduleId]: true }))
        toast({ title: "Already checked in", description: "You are already marked present." })
      } else {
        toast({
          title: "Check-in failed",
          description: result.error || "QR code invalid or expired.",
          variant: "destructive",
        })
      }
    } finally {
      setCheckingIn(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (decorated.length === 0) {
    return (
      <div className="text-center py-16">
        <CalendarClock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No sessions today</h3>
        <p className="text-muted-foreground">
          You have no scheduled sessions today. Check back on a class day to mark your attendance.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {decorated.map((s) => {
        const isSelected = selectedScheduleId === s.schedule._id
        const present = checkedIn[s.schedule._id]
        return (
          <Card key={s.schedule._id} className={s.isOpen ? "border-primary/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base text-balance">{s.courseLabel}</CardTitle>
                {present ? (
                  <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400 shrink-0">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Present
                  </Badge>
                ) : s.isOpen ? (
                  <Badge variant="outline" className="border-primary/40 text-primary shrink-0">
                    Open
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    Closed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {s.schedule.startTime} – {s.schedule.endTime}
                </span>
                {s.schedule.room?.name && <span>· {s.schedule.room.name}</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {present ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-green-500/5 py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  <p className="font-medium">You are marked present</p>
                </div>
              ) : isSelected && activeQR ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-xl bg-white p-4">
                    <QRCodeSVG value={activeQR.token} size={176} level="M" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan this code on the room&apos;s smart board, or tap below to confirm your
                    attendance for this session.
                  </p>
                  <Button
                    onClick={() => handleCheckIn(s.schedule._id)}
                    disabled={checkingIn}
                    className="w-full"
                  >
                    {checkingIn ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Confirm attendance
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {!s.isOpen && (
                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {s.minutesFromStart < 0
                          ? `Check-in opens at ${s.schedule.startTime}.`
                          : `Check-in closed ${CHECKIN_WINDOW_MINUTES} minutes after the session start.`}
                      </span>
                    </div>
                  )}
                  <Button
                    variant={s.isOpen ? "default" : "outline"}
                    className="w-full"
                    disabled={!s.isOpen || (qrLoading && isSelected)}
                    onClick={() => handleShowQR(s.schedule._id)}
                  >
                    {qrLoading && isSelected ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <QrCode className="mr-2 h-4 w-4" />
                    )}
                    Show QR &amp; check in
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
