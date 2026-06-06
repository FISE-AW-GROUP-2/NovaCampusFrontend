"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { CourseCard } from "./course-card"
import { CourseFormDialog } from "./course-form-dialog"
import { ResourceUploadDialog } from "./resource-upload-dialog"
import { ResourcesSheet } from "./resources-sheet"
import { useToast } from "@/hooks/use-toast"
import {
  getCoursesApi,
  deleteCourseApi,
  uploadCourseResourceApi,
} from "@/lib/api/courses"
import type { Course, ResourceType } from "@/types/course"
import { Plus, Search, BookOpen } from "lucide-react"

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = ["all", ...Array.from({ length: 5 }, (_, i) => {
  const year = CURRENT_YEAR + i - 2
  return `${year}-${year + 1}`
})]
const SEMESTERS = ["all", "Fall", "Spring", "Summer"]

export function TeacherCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [semester, setSemester] = useState("all")
  const [academicYear, setAcademicYear] = useState("all")

  // Dialog states
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  // Resource states
  const [showResourcesSheet, setShowResourcesSheet] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const { toast } = useToast()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCoursesApi({
        search: search || undefined,
        semester: semester !== "all" ? semester : undefined,
        academicYear: academicYear !== "all" ? academicYear : undefined,
      })
      if (result.success && result.data) {
        setCourses(result.data.courses)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch courses",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [search, semester, academicYear])

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300)
    return () => clearTimeout(debounce)
  }, [fetchCourses])

  const handleCourseSuccess = (course: Course) => {
    setCourses((prev) => {
      const exists = prev.find((c) => c._id === course._id)
      return exists
        ? prev.map((c) => (c._id === course._id ? course : c))
        : [course, ...prev]
    })
    setEditingCourse(null)
  }

  const handleDeleteCourse = async (courseId: string) => {
    const result = await deleteCourseApi(courseId)
    if (result.success) {
      setCourses((prev) => prev.filter((c) => c._id !== courseId))
      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (course: Course) => {
    setEditingCourse(course)
    setShowCourseForm(true)
  }

  const handleManageResources = (course: Course) => {
    setSelectedCourse(course)
    setShowResourcesSheet(true)
  }

  const handleUploadResource = async (file: File, type: ResourceType) => {
    if (!selectedCourse) return
    setIsUploading(true)
    try {
      const result = await uploadCourseResourceApi(selectedCourse._id, file, type)
      if (result.success) {
        setShowUploadDialog(false)
        toast({
          title: "Resource uploaded",
          description: `${file.name} has been uploaded successfully.`,
        })
        // Refresh resources sheet by closing and reopening
        setShowResourcesSheet(false)
        setTimeout(() => setShowResourcesSheet(true), 100)
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload resource",
          variant: "destructive",
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setEditingCourse(null)
    }
    setShowCourseForm(open)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTERS.map((sem) => (
              <SelectItem key={sem} value={sem}>
                {sem === "all" ? "All Semesters" : sem}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={academicYear} onValueChange={setAcademicYear}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year === "all" ? "All Years" : year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCourseForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">
            {search || semester !== "all" || academicYear !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first course"}
          </p>
          {!search && semester === "all" && academicYear === "all" && (
            <Button onClick={() => setShowCourseForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              onEdit={handleEditClick}
              onDelete={handleDeleteCourse}
              onManageResources={handleManageResources}
            />
          ))}
        </div>
      )}

      {/* Course Form Dialog */}
      <CourseFormDialog
        open={showCourseForm}
        onOpenChange={handleFormClose}
        course={editingCourse}
        onSuccess={handleCourseSuccess}
      />

      {/* Resources Sheet */}
      <ResourcesSheet
        open={showResourcesSheet}
        onOpenChange={setShowResourcesSheet}
        course={selectedCourse}
        onUploadClick={() => setShowUploadDialog(true)}
      />

      {/* Resource Upload Dialog */}
      <ResourceUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        courseId={selectedCourse?._id || ""}
        onUpload={handleUploadResource}
        isLoading={isUploading}
      />
    </div>
  )
}
