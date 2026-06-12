// Grade Service Types based on the class diagram (CD_Grade)

export type GradeType = "exam" | "project" | "oral" | "assignment"

export type GradeSummaryStatus = "passing" | "failing" | "pending"

export interface Grade {
  _id: string
  studentId: string
  courseId: string
  campusId?: string
  value: number
  maxValue: number
  type: GradeType
  semester?: string
  academicYear?: string
  enteredBy?: string
  enteredAt?: string
  updatedAt?: string
  // Optional denormalized fields some backends attach for display
  courseName?: string
  courseCode?: string
  studentName?: string
  studentEmail?: string
}

export interface GradeSummary {
  _id?: string
  studentId: string
  courseId: string
  semester?: string
  academicYear?: string
  average: number
  status: GradeSummaryStatus
  computedAt?: string
  courseName?: string
  courseCode?: string
}

export interface GradeFormData {
  studentId: string
  courseId: string
  value: number
  maxValue?: number
  type: GradeType
  semester?: string
  academicYear?: string
}

export interface GradeQueryParams {
  courseId?: string
  studentId?: string
  semester?: string
  academicYear?: string
  type?: GradeType
}

export interface GradesListResponse {
  grades: Grade[]
  summaries?: GradeSummary[]
  overallAverage?: number
  total?: number
}

export const gradeTypeConfig: Record<GradeType, { label: string; color: string; bgColor: string }> = {
  exam: {
    label: "Exam",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  project: {
    label: "Project",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  oral: {
    label: "Oral",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  assignment: {
    label: "Assignment",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
}

export const summaryStatusConfig: Record<GradeSummaryStatus, { label: string; color: string; bgColor: string }> = {
  passing: {
    label: "Passing",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  failing: {
    label: "Failing",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
}

// Mirror of Grade.toPercentage() from the class diagram.
export function gradeToPercentage(grade: Pick<Grade, "value" | "maxValue">): number {
  if (!grade.maxValue) return 0
  return Math.round((grade.value / grade.maxValue) * 1000) / 10
}

// Mirror of Grade.isPassing() (>= 50% of maxValue).
export function isPassingGrade(grade: Pick<Grade, "value" | "maxValue">): boolean {
  return gradeToPercentage(grade) >= 50
}
