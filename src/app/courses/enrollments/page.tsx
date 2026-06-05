"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { EducationManagerCoursesContent } from "@/components/courses/education-manager-courses-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"

export default function EducationManagerCoursesPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ProtectedRoute allowedRoles={[UserRole.EDUCATION_MANAGER, UserRole.CENTRAL_ADMIN]}>
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
            title="Course Enrollments"
            description="Manage student enrollments for courses. Add or remove students from available courses."
          />

          <div className="mt-6">
            <EducationManagerCoursesContent />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
