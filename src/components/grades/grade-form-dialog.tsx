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
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { createGradeApi, updateGradeApi } from "@/lib/api/grades"
import { getCourseEnrollmentsApi } from "@/lib/api/courses"
import { gradeTypeConfig, type Grade, type GradeType } from "@/types/grade"
import type { Course, Enrollment } from "@/types/course"

interface GradeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courses: Course[]
  /** Pre-selected course (when the list is filtered by course). */
  defaultCourseId?: string
  /** When set, the dialog edits this grade instead of creating one. */
  grade?: Grade | null
  onSuccess?: () => void
}

const GRADE_TYPES = Object.keys(gradeTypeConfig) as GradeType[]
const SEMESTERS = ["Fall", "Spring", "Summer"]
const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = CURRENT_YEAR + i - 2
  return `${year}-${year + 1}`
})

interface FormState {
  courseId: string
  studentId: string
  type: GradeType
  value: string
  maxValue: string
  semester: string
  academicYear: string
}

const DEFAULT_FORM: FormState = {
  courseId: "",
  studentId: "",
  type: "exam",
  value: "",
  maxValue: "20",
  semester: "Fall",
  academicYear: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`,
}

function enrollmentStudentLabel(e: Enrollment): string {
  return e.student?.name || e.studentName || e.studentEmail || e.studentId
}

export function GradeFormDialog({
  open,
  onOpenChange,
  courses,
  defaultCourseId,
  grade,
  onSuccess,
}: GradeFormDialogProps) {
  const { toast } = useToast()
  const isEditing = !!grade

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (grade) {
      setForm({
        courseId: grade.courseId,
        studentId: grade.studentId,
        type: grade.type,
        value: String(grade.value),
        maxValue: String(grade.maxValue ?? 20),
        semester: grade.semester || DEFAULT_FORM.semester,
        academicYear: grade.academicYear || DEFAULT_FORM.academicYear,
      })
    } else {
      setForm({ ...DEFAULT_FORM, courseId: defaultCourseId || "" })
    }
  }, [open, grade, defaultCourseId])

  // Load the enrolled students of the selected course for the student picker.
  useEffect(() => {
    if (!open || !form.courseId || isEditing) return
    let cancelled = false
    setLoadingStudents(true)
    getCourseEnrollmentsApi(form.courseId)
      .then((result) => {
        if (cancelled) return
        setEnrollments(result.success ? result.data?.enrollments ?? [] : [])
      })
      .finally(() => {
        if (!cancelled) setLoadingStudents(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, form.courseId, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const value = Number(form.value)
    const maxValue = Number(form.maxValue)
    if (Number.isNaN(value) || value < 0 || Number.isNaN(maxValue) || maxValue <= 0) {
      toast({
        title: "Invalid grade",
        description: "Enter a numeric value and a positive maximum.",
        variant: "destructive",
      })
      return
    }
    if (value > maxValue) {
      toast({
        title: "Invalid grade",
        description: `The value cannot exceed the maximum (${maxValue}).`,
        variant: "destructive",
      })
      return
    }
    if (!isEditing && (!form.courseId || !form.studentId)) {
      toast({
        title: "Missing fields",
        description: "Select a course and a student.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = isEditing
        ? await updateGradeApi(grade!._id, {
            value,
            maxValue,
            type: form.type,
            semester: form.semester,
            academicYear: form.academicYear,
          })
        : await createGradeApi({
            studentId: form.studentId,
            courseId: form.courseId,
            value,
            maxValue,
            type: form.type,
            semester: form.semester,
            academicYear: form.academicYear,
          })

      if (result.success) {
        toast({
          title: isEditing ? "Grade updated" : "Grade saved",
          description: isEditing
            ? "The grade has been updated."
            : "The grade has been recorded and the student notified.",
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save the grade.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Grade" : "Add Grade"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the value or details of this grade."
              : "Record a grade for a student in one of your courses."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) => setForm({ ...form, courseId: v, studentId: "" })}
                >
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.code} — {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm({ ...form, studentId: v })}
                  disabled={!form.courseId || loadingStudents}
                >
                  <SelectTrigger id="student">
                    <SelectValue
                      placeholder={
                        !form.courseId
                          ? "Select a course first"
                          : loadingStudents
                            ? "Loading students..."
                            : enrollments.length === 0
                              ? "No enrolled students"
                              : "Select a student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((e) => (
                      <SelectItem key={e._id} value={e.studentId}>
                        {enrollmentStudentLabel(e)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                min={0}
                step="0.5"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="e.g., 14.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxValue">Max value</Label>
              <Input
                id="maxValue"
                type="number"
                min={1}
                step="0.5"
                value={form.maxValue}
                onChange={(e) => setForm({ ...form, maxValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as GradeType })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {gradeTypeConfig[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(v) => setForm({ ...form, semester: v })}
              >
                <SelectTrigger id="semester">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select
                value={form.academicYear}
                onValueChange={(v) => setForm({ ...form, academicYear: v })}
              >
                <SelectTrigger id="academicYear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Save changes" : "Add grade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
