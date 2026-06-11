"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { JustificationDialog } from "./justification-dialog"
import { useToast } from "@/hooks/use-toast"
import { getAbsencesApi } from "@/lib/api/absences"
import {
  absenceStatusConfig,
  justificationDecisionConfig,
  type Absence,
  type AbsenceStatus,
} from "@/types/absence"
import { CalendarX2, FileUp, FileText, ClipboardList } from "lucide-react"

const STATUS_OPTIONS: Array<AbsenceStatus | "all"> = ["all", "absent", "justified", "confirmed"]
const STATUS_LABELS: Record<AbsenceStatus | "all", string> = {
  all: "All statuses",
  absent: "Absent",
  justified: "Pending Review",
  confirmed: "Justified",
}

// Justification window in days from the session date (per the activity diagram).
const JUSTIFY_WINDOW_DAYS = 7

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function withinJustifyWindow(sessionDate: string): boolean {
  const session = new Date(sessionDate).getTime()
  if (Number.isNaN(session)) return false
  const deadline = session + JUSTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  return Date.now() <= deadline
}

export function AbsenceRecordsContent() {
  const { toast } = useToast()

  const [absences, setAbsences] = useState<Absence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState<AbsenceStatus | "all">("all")

  const [justifyTarget, setJustifyTarget] = useState<Absence | null>(null)
  const [showJustify, setShowJustify] = useState(false)

  const fetchAbsences = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAbsencesApi({ status })
      if (result.success && result.data) {
        setAbsences(result.data.absences)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch absence records.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [status, toast])

  useEffect(() => {
    fetchAbsences()
  }, [fetchAbsences])

  const handleJustify = (absence: Absence) => {
    setJustifyTarget(absence)
    setShowJustify(true)
  }

  // After a successful submission, the absence moves to "justified" (pending).
  const handleJustifySuccess = (absenceId: string) => {
    setAbsences((prev) =>
      prev.map((a) => (a._id === absenceId ? { ...a, status: "justified" } : a))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as AbsenceStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {STATUS_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : absences.length === 0 ? (
        <div className="text-center py-16">
          <CalendarX2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No absence records</h3>
          <p className="text-muted-foreground">
            {status === "all"
              ? "You have a clean attendance record. Keep it up!"
              : "No records match the selected status."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="hidden sm:table-cell">Session date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Justification</TableHead>
                <TableHead className="w-28 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences.map((absence) => {
                const cfg = absenceStatusConfig[absence.status]
                const justification = absence.justification
                const canJustify =
                  absence.status === "absent" && withinJustifyWindow(absence.sessionDate)
                return (
                  <TableRow key={absence._id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {absence.courseName ||
                            absence.courseCode ||
                            "Course"}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {formatDate(absence.sessionDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(absence.sessionDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${cfg.bgColor} ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {justification ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={justificationDecisionConfig[justification.decision].color}
                          >
                            {justificationDecisionConfig[justification.decision].label}
                          </Badge>
                          {justification.documentUrl && (
                            <a
                              href={justification.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              title="View submitted document"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canJustify ? (
                        <Button size="sm" variant="outline" onClick={() => handleJustify(absence)}>
                          <FileUp className="mr-1.5 h-3.5 w-3.5" />
                          Justify
                        </Button>
                      ) : justification?.decision === "rejected" ? (
                        <span
                          className="text-xs text-red-600 dark:text-red-400"
                          title={justification.rejectionNote}
                        >
                          Rejected
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Rejection notes are surfaced inline so students see reviewer feedback. */}
      {absences.some((a) => a.justification?.decision === "rejected" && a.justification.rejectionNote) && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Reviewer notes</h4>
          </div>
          <ul className="space-y-2">
            {absences
              .filter((a) => a.justification?.decision === "rejected" && a.justification.rejectionNote)
              .map((a) => (
                <li key={a._id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {a.courseName || a.courseCode || "Course"}:
                  </span>{" "}
                  {a.justification?.rejectionNote}
                </li>
              ))}
          </ul>
        </Card>
      )}

      <JustificationDialog
        open={showJustify}
        onOpenChange={(open) => {
          setShowJustify(open)
          if (!open) setJustifyTarget(null)
        }}
        absence={justifyTarget}
        onSuccess={handleJustifySuccess}
      />
    </div>
  )
}
