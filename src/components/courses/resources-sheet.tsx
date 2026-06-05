"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import type { Course, CourseResource, ResourceType } from "@/types/course"
import { getCourseResourcesApi, deleteCourseResourceApi } from "@/lib/api/courses"
import {
  FileText,
  Video,
  Presentation,
  File,
  Trash2,
  Download,
  Plus,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResourcesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onUploadClick: () => void
}

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

export function ResourcesSheet({
  open,
  onOpenChange,
  course,
  onUploadClick,
}: ResourcesSheetProps) {
  const [resources, setResources] = useState<CourseResource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteResource, setDeleteResource] = useState<CourseResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && course) {
      fetchResources()
    }
  }, [open, course])

  const fetchResources = async () => {
    if (!course) return
    setIsLoading(true)
    try {
      const result = await getCourseResourcesApi(course._id)
      if (result.success && result.data) {
        setResources(result.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!course || !deleteResource) return
    setIsDeleting(true)
    try {
      const result = await deleteCourseResourceApi(course._id, deleteResource._id)
      if (result.success) {
        setResources((prev) => prev.filter((r) => r._id !== deleteResource._id))
        toast({
          title: "Resource deleted",
          description: "The resource has been removed from this course.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete resource",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setDeleteResource(null)
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Course Resources</SheetTitle>
            <SheetDescription>
              {course?.name} ({course?.code})
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">
                {resources.length} {resources.length === 1 ? "Resource" : "Resources"}
              </h4>
              <Button size="sm" onClick={onUploadClick}>
                <Plus className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-6 w-6" />
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No resources uploaded yet</p>
                <Button className="mt-4" onClick={onUploadClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload First Resource
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-3 pr-4">
                  {resources.map((resource) => {
                    const Icon = ResourceTypeIcon[resource.type] || File
                    const colorClass = ResourceTypeColors[resource.type] || ResourceTypeColors.other

                    return (
                      <div
                        key={resource._id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className={`p-2 rounded-md ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{resource.filename}</p>
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
                              title="Open in new tab"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteResource(resource)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteResource} onOpenChange={() => setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteResource?.filename}&quot;? This
              action cannot be undone.
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
