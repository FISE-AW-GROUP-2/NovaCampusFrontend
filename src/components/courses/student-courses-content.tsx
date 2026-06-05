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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { getCoursesApi, getCourseByIdApi, getCourseResourcesApi } from "@/lib/api/courses"
import type { Course, CourseResource } from "@/types/course"
import {
  Search,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  FileText,
  Video,
  Presentation,
  File,
  Download,
  ExternalLink,
  Eye,
} from "lucide-react"

const CURRENT_YEAR = new Date().getFullYear()
const ACADEMIC_YEARS = ["all", ...Array.from({ length: 5 }, (_, i) => {
  const year = CURRENT_YEAR + i - 2
  return `${year}-${year + 1}`
})]
const SEMESTERS = ["all", "Fall", "Spring", "Summer"]

const ResourceTypeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  slides: Presentation,
  document: FileText,
  video: Video,
  other: File,
}

const ResourceTypeColors: Record<string, string> = {
  slides: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  document: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  video: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
}

export function StudentCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [semester, setSemester] = useState("all")
  const [academicYear, setAcademicYear] = useState("all")

  // Course detail states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const { toast } = useToast()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getCoursesApi({
        search: search || undefined,
        semester: semester !== "all" ? semester : undefined,
        academicYear: academicYear !== "all" ? academicYear : undefined,
        isActive: true,
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
  }, [search, semester, academicYear, toast])

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300)
    return () => clearTimeout(debounce)
  }, [fetchCourses])

  const handleViewCourse = async (course: Course) => {
    setSelectedCourse(course)
    setShowDetails(true)
    setIsLoadingDetails(true)
    try {
      const [courseResult, resourcesResult] = await Promise.all([
        getCourseByIdApi(course._id),
        getCourseResourcesApi(course._id),
      ])
      if (courseResult.success && courseResult.data) {
        setSelectedCourse(courseResult.data.course)
      }
      if (resourcesResult.success && resourcesResult.data) {
        setResources(resourcesResult.data)
      }
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
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
          <p className="text-muted-foreground">
            {search || semester !== "all" || academicYear !== "all"
              ? "Try adjusting your search filters"
              : "No courses are currently available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course._id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Badge variant="default">{course.code}</Badge>
                    <CardTitle className="text-lg leading-tight mt-2">
                      {course.name}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {course.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{course.credits} Credits</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {course.enrollmentCount ?? 0}/{course.maxStudents}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{course.semester}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.academicYear}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewCourse(course)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-lg">
          {selectedCourse && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge>{selectedCourse.code}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedCourse.semester} {selectedCourse.academicYear}
                  </span>
                </div>
                <SheetTitle className="text-xl">{selectedCourse.name}</SheetTitle>
                <SheetDescription>{selectedCourse.description}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Course Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <GraduationCap className="h-4 w-4" />
                      Credits
                    </div>
                    <p className="font-medium">{selectedCourse.credits}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Users className="h-4 w-4" />
                      Enrollment
                    </div>
                    <p className="font-medium">
                      {selectedCourse.enrollmentCount ?? 0}/{selectedCourse.maxStudents}
                    </p>
                  </div>
                </div>

                {/* Resources Section */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Course Resources
                    <Badge variant="secondary" className="ml-auto">
                      {resources.length}
                    </Badge>
                  </h4>

                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No resources available yet
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2 pr-4">
                        {resources.map((resource) => {
                          const Icon = ResourceTypeIcon[resource.type] || File
                          const colorClass =
                            ResourceTypeColors[resource.type] || ResourceTypeColors.other

                          return (
                            <div
                              key={resource._id}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className={`p-2 rounded-md ${colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {resource.filename}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {resource.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(resource.uploadedAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={resource.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a href={resource.fileUrl} download title="Download">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
