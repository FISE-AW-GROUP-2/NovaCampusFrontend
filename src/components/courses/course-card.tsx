"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useState } from "react"
import type { Course } from "@/types/course"
import {
  MoreVertical,
  Edit,
  Trash2,
  Users,
  FileText,
  BookOpen,
  Calendar,
  GraduationCap,
} from "lucide-react"

interface CourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onDelete: (courseId: string) => Promise<void>
  onManageResources: (course: Course) => void
}

export function CourseCard({
  course,
  onEdit,
  onDelete,
  onManageResources,
}: CourseCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(course._id)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={course.isActive ? "default" : "secondary"}>
                  {course.code}
                </Badge>
                {!course.isActive && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{course.name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(course)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageResources(course)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Resources
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription className="line-clamp-2">
            {course.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
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
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onManageResources(course)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Resources
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(course)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{course.name}&quot;? This action cannot
              be undone and will remove all associated resources and enrollments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
