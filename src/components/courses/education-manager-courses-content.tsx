"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { EnrollStudentDialog } from "./enroll-student-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getCoursesApi,
  getCourseEnrollmentsApi,
  enrollStudentApi,
  unenrollStudentApi,
  updateEnrollmentStatusApi,
} from "@/lib/api/courses"
import type { Course, Enrollment, EnrollmentStatus } from "@/types/course"
import {
  Search,
  Users,
  BookOpen,
  UserPlus,
  UserMinus,
  GraduationCap,
  Calendar,
} from "lucide-react"

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = ["all", ...Array.from({ length: 5 }, (_, i) => {
  const year = CURRENT_YEAR + i - 2
  return `${year}-${year + 1}`
})]
const SEMESTERS = ["all", "Fall", "Spring", "Summer"]

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

export function EducationManagerCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false)

  const [search, setSearch] = useState("")
  const [semester, setSemester] = useState("all")
  const [academicYear, setAcademicYear] = useState("all")

  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [removeEnrollment, setRemoveEnrollment] = useState<Enrollment | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const { toast } = useToast()

  const fetchCourses = useCallback(async () => {
    setIsLoadingCourses(true)
    try {
      const result = await getCoursesApi({
        search: search || undefined,
        semester: semester !== "all" ? semester : undefined,
        academicYear: academicYear !== "all" ? academicYear : undefined,
        isActive: true,
      })
      if (result.success && result.data) {
        setCourses(result.data.courses)
      }
    } finally {
      setIsLoadingCourses(false)
    }
  }, [search, semester, academicYear])

  const fetchEnrollments = useCallback(async (courseId: string) => {
    setIsLoadingEnrollments(true)
    try {
      const result = await getCourseEnrollmentsApi(courseId)
      if (result.success && result.data) {
        setEnrollments(result.data.enrollments)
      }
    } finally {
      setIsLoadingEnrollments(false)
    }
  }, [])

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300)
    return () => clearTimeout(debounce)
  }, [fetchCourses])

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse._id)
    } else {
      setEnrollments([])
    }
  }, [selectedCourse, fetchEnrollments])

  const handleEnrollStudent = async (studentId: string) => {
    if (!selectedCourse) return
    setIsEnrolling(true)
    try {
      const result = await enrollStudentApi(selectedCourse._id, { studentId })
      if (result.success && result.data) {
        setEnrollments((prev) => [...prev, result.data!])
        setShowEnrollDialog(false)
        toast({
          title: "Student enrolled",
          description: "The student has been enrolled in the course.",
        })
      } else {
        toast({
          title: "Enrollment failed",
          description: result.error || "Failed to enroll student",
          variant: "destructive",
        })
      }
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleUnenrollStudent = async () => {
    if (!selectedCourse || !removeEnrollment) return
    setIsRemoving(true)
    try {
      const result = await unenrollStudentApi(selectedCourse._id, removeEnrollment._id)
      if (result.success) {
        setEnrollments((prev) => prev.filter((e) => e._id !== removeEnrollment._id))
        toast({
          title: "Student removed",
          description: "The student has been removed from the course.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove student",
          variant: "destructive",
        })
      }
    } finally {
      setIsRemoving(false)
      setRemoveEnrollment(null)
    }
  }

  const handleStatusChange = async (enrollment: Enrollment, newStatus: EnrollmentStatus) => {
    if (!selectedCourse) return
    const result = await updateEnrollmentStatusApi(
      selectedCourse._id,
      enrollment._id,
      newStatus
    )
    if (result.success && result.data) {
      setEnrollments((prev) =>
        prev.map((e) => (e._id === enrollment._id ? result.data! : e))
      )
      toast({
        title: "Status updated",
        description: `Enrollment status changed to ${newStatus}.`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Courses List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem === "all" ? "All" : sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year === "all" ? "All Years" : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingCourses ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No courses found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => (
              <Card
                key={course._id}
                className={`cursor-pointer transition-colors ${
                  selectedCourse?._id === course._id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedCourse(course)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {course.code}
                      </Badge>
                      <CardTitle className="text-sm font-medium leading-tight">
                        {course.name}
                      </CardTitle>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 justify-end">
                        <Users className="h-3 w-3" />
                        {course.enrollmentCount ?? 0}/{course.maxStudents}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {course.semester} {course.academicYear}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Enrollments Panel */}
      <div className="lg:col-span-2">
        {selectedCourse ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge>{selectedCourse.code}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedCourse.semester} {selectedCourse.academicYear}
                    </span>
                  </div>
                  <CardTitle>{selectedCourse.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {enrollments.length}/{selectedCourse.maxStudents} enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {selectedCourse.credits} credits
                    </span>
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowEnrollDialog(true)}
                  disabled={enrollments.length >= selectedCourse.maxStudents}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Enroll Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEnrollments ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">No students enrolled yet</p>
                  <Button onClick={() => setShowEnrollDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enroll First Student
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrolled On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(enrollment.student?.name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {enrollment.student?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {enrollment.student?.email || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(enrollment.enrolledAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={enrollment.status}
                            onValueChange={(value) =>
                              handleStatusChange(enrollment, value as EnrollmentStatus)
                            }
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="dropped">Dropped</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRemoveEnrollment(enrollment)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Course</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Choose a course from the list to view and manage student enrollments.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enroll Student Dialog */}
      {selectedCourse && (
        <EnrollStudentDialog
          open={showEnrollDialog}
          onOpenChange={setShowEnrollDialog}
          courseName={selectedCourse.name}
          onEnroll={handleEnrollStudent}
          isLoading={isEnrolling}
          enrolledStudentIds={enrollments.map((e) => e.studentId)}
        />
      )}

      {/* Remove Enrollment Dialog */}
      <AlertDialog open={!!removeEnrollment} onOpenChange={() => setRemoveEnrollment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeEnrollment?.student?.name} from this
              course? This action can be undone by re-enrolling the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenrollStudent}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
