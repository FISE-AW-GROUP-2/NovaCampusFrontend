"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StudentCoursesContent } from "@/components/courses/student-courses-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"

export default function StudentCoursesPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.CENTRAL_ADMIN]}>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
        </div>

        <main
          className={cn(
            "flex-1 p-4 md:p-5 lg:p-6 transition-all duration-300",
            isCollapsed ? "lg:ml-16" : "lg:ml-60"
          )}
        >
          <Header
            title="Available Courses"
            description="Browse available courses and access course materials."
          />

          <div className="mt-6">
            <StudentCoursesContent />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
