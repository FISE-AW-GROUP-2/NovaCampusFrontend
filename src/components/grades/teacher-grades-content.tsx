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
import { GradeFormDialog } from "./grade-form-dialog"
import { useToast } from "@/hooks/use-toast"
import { getGradesApi, deleteGradeApi } from "@/lib/api/grades"
import { getCoursesApi, getCourseEnrollmentsApi } from "@/lib/api/courses"
import {
  gradeTypeConfig,
  gradeToPercentage,
  isPassingGrade,
  type Grade,
  type GradeType,
} from "@/types/grade"
import type { Course, Enrollment } from "@/types/course"
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react"

const TYPE_OPTIONS: Array<GradeType | "all"> = ["all", "exam", "project", "oral", "assignment"]

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

export function TeacherGradesContent() {
  const { toast } = useToast()

  const [grades, setGrades] = useState<Grade[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<GradeType | "all">("all")

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Grade | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // The teacher's own courses, used by filters and the grade form.
  useEffect(() => {
    getCoursesApi().then((result) => {
      if (result.success && result.data) {
        setCourses(result.data.courses ?? [])
      }
    })
  }, [])

  const fetchGrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getGradesApi({
        courseId: courseFilter !== "all" ? courseFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      })
      if (result.success && result.data) {
        setGrades(result.data.grades)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch grades.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [courseFilter, typeFilter, toast])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  // Resolve student names from course enrollments so the table shows names
  // even when the grade documents only carry studentId.
  useEffect(() => {
    if (courses.length === 0) return
    let cancelled = false
    Promise.all(courses.map((c) => getCourseEnrollmentsApi(c._id))).then((results) => {
      if (cancelled) return
      const names: Record<string, string> = {}
      results.forEach((result) => {
        const enrollments: Enrollment[] = result.success
          ? result.data?.enrollments ?? []
          : []
        enrollments.forEach((e) => {
          const name = e.student?.name || e.studentName || e.studentEmail
          if (name) names[e.studentId] = name
        })
      })
      setStudentNames(names)
    })
    return () => {
      cancelled = true
    }
  }, [courses])

  const courseById = useMemo(() => {
    const map: Record<string, Course> = {}
    courses.forEach((c) => {
      map[c._id] = c
    })
    return map
  }, [courses])

  const studentLabel = (grade: Grade) =>
    grade.studentName || studentNames[grade.studentId] || grade.studentId

  const courseLabel = (grade: Grade) => {
    const course = courseById[grade.courseId]
    if (course) return `${course.code} — ${course.name}`
    return grade.courseName || grade.courseCode || grade.courseId
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const result = await deleteGradeApi(deleteTarget._id)
      if (result.success) {
        toast({ title: "Grade deleted", description: "The grade has been removed." })
        setGrades((prev) => prev.filter((g) => g._id !== deleteTarget._id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete the grade.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.code} — {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as GradeType | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All types" : gradeTypeConfig[opt].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="sm:ml-auto"
          onClick={() => {
            setEditTarget(null)
            setShowForm(true)
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add grade
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
            {courseFilter === "all" && typeFilter === "all"
              ? "Start by adding a grade for one of your students."
              : "No grades match the selected filters."}
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead className="hidden lg:table-cell">Semester</TableHead>
                <TableHead className="hidden lg:table-cell">Entered</TableHead>
                <TableHead className="w-24 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => {
                const cfg = gradeTypeConfig[grade.type] ?? gradeTypeConfig.exam
                const passing = isPassingGrade(grade)
                return (
                  <TableRow key={grade._id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{studentLabel(grade)}</p>
                        <p className="text-xs text-muted-foreground md:hidden truncate">
                          {courseLabel(grade)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {courseLabel(grade)}
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
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({gradeToPercentage(grade)}%)
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {grade.semester || "—"}
                      {grade.academicYear ? ` ${grade.academicYear}` : ""}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(grade.enteredAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit grade"
                          onClick={() => {
                            setEditTarget(grade)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete grade"
                          onClick={() => setDeleteTarget(grade)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <GradeFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditTarget(null)
        }}
        courses={courses}
        defaultCourseId={courseFilter !== "all" ? courseFilter : undefined}
        grade={editTarget}
        onSuccess={fetchGrades}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this grade?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `The ${gradeTypeConfig[deleteTarget.type]?.label.toLowerCase() ?? "grade"} of ${studentLabel(deleteTarget)} (${deleteTarget.value}/${deleteTarget.maxValue}) will be permanently removed and the course average recomputed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Spinner className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
