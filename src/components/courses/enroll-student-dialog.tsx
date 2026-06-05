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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getStudentsApi } from "@/lib/api/courses"
import { Search, User, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  email: string
}

interface EnrollStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseName: string
  onEnroll: (studentId: string) => Promise<void>
  isLoading?: boolean
  enrolledStudentIds: string[]
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  courseName,
  onEnroll,
  isLoading,
  enrolledStudentIds,
}: EnrollStudentDialogProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    if (open) {
      fetchStudents()
    } else {
      setSelectedStudent(null)
      setSearch("")
    }
  }, [open])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (open) {
        fetchStudents(search)
      }
    }, 300)
    return () => clearTimeout(debounce)
  }, [search, open])

  const fetchStudents = async (searchTerm?: string) => {
    setIsSearching(true)
    try {
      const result = await getStudentsApi(searchTerm)
      if (result.success && result.data) {
        setStudents(result.data)
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    await onEnroll(selectedStudent.id)
    setSelectedStudent(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const availableStudents = students.filter(
    (s) => !enrolledStudentIds.includes(s.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Select a student to enroll in {courseName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Students</Label>
              <div className="border rounded-lg">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {students.length === 0
                        ? "No students found"
                        : "All students are already enrolled"}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[240px]">
                    <div className="p-2 space-y-1">
                      {availableStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                            selectedStudent?.id === student.id
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {student.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                          {selectedStudent?.id === student.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedStudent}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Enroll Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
