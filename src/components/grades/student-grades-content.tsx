"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { getMyGradesApi, exportMyGradesApi } from "@/lib/api/grades"
import {
  gradeTypeConfig,
  gradeToPercentage,
  isPassingGrade,
  summaryStatusConfig,
  type Grade,
  type GradeSummary,
} from "@/types/grade"
import { Download, GraduationCap, TrendingUp } from "lucide-react"

const SEMESTER_OPTIONS = ["all", "Fall", "Spring", "Summer"]

function formatDate(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function StudentGradesContent() {
  const { toast } = useToast()

  const [grades, setGrades] = useState<Grade[]>([])
  const [summaries, setSummaries] = useState<GradeSummary[]>([])
  const [overallAverage, setOverallAverage] = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [semester, setSemester] = useState<string>("all")

  const fetchGrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getMyGradesApi({
        semester: semester !== "all" ? semester : undefined,
      })
      if (result.success && result.data) {
        setGrades(result.data.grades)
        setSummaries(result.data.summaries ?? [])
        setOverallAverage(result.data.overallAverage)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch your grades.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [semester, toast])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  // Fallback when the backend does not send the overall average:
  // mean of the grade percentages.
  const computedAverage = useMemo(() => {
    if (overallAverage !== undefined) return overallAverage
    if (grades.length === 0) return undefined
    const sum = grades.reduce((acc, g) => acc + gradeToPercentage(g), 0)
    return Math.round((sum / grades.length) * 10) / 10
  }, [overallAverage, grades])

  const courseName = (courseId: string, fallback?: string) => {
    const summary = summaries.find((s) => s.courseId === courseId)
    return summary?.courseName || summary?.courseCode || fallback || courseId
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportMyGradesApi({
        semester: semester !== "all" ? semester : undefined,
      })
      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data)
        const link = document.createElement("a")
        link.href = url
        link.download = semester !== "all" ? `grades-${semester}.pdf` : "grades.pdf"
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        toast({ title: "Export ready", description: "Your grade transcript has been downloaded." })
      } else {
        toast({
          title: "Export failed",
          description: result.error || "Could not generate the PDF.",
          variant: "destructive",
        })
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTER_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All semesters" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="sm:ml-auto"
          onClick={handleExport}
          disabled={isExporting || grades.length === 0}
        >
          {isExporting ? (
            <Spinner className="mr-1.5 h-4 w-4" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Export PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : grades.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No grades yet</h3>
          <p className="text-muted-foreground">
            {semester === "all"
              ? "Your grades will appear here once your teachers publish them."
              : "No grades recorded for the selected semester."}
          </p>
        </div>
      ) : (
        <>
          {/* Overall average + per-course summaries */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Overall average
                </p>
              </div>
              <p className="text-2xl font-bold">
                {computedAverage !== undefined ? `${computedAverage}%` : "—"}
              </p>
            </Card>

            {summaries.map((summary) => {
              const cfg = summaryStatusConfig[summary.status] ?? summaryStatusConfig.pending
              return (
                <Card key={summary.courseId} className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 truncate">
                    {courseName(summary.courseId)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-2xl font-bold">{summary.average}</p>
                    <Badge variant="secondary" className={`${cfg.bgColor} ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="hidden sm:table-cell">Percentage</TableHead>
                  <TableHead className="hidden lg:table-cell">Semester</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => {
                  const cfg = gradeTypeConfig[grade.type] ?? gradeTypeConfig.exam
                  const passing = isPassingGrade(grade)
                  return (
                    <TableRow key={grade._id}>
                      <TableCell>
                        <p className="font-medium text-sm truncate">
                          {grade.courseName ||
                            grade.courseCode ||
                            courseName(grade.courseId)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${cfg.bgColor} ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            passing
                              ? "font-medium text-green-700 dark:text-green-400"
                              : "font-medium text-red-700 dark:text-red-400"
                          }
                        >
                          {grade.value}/{grade.maxValue}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {gradeToPercentage(grade)}%
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {grade.semester || "—"}
                        {grade.academicYear ? ` ${grade.academicYear}` : ""}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(grade.enteredAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}
