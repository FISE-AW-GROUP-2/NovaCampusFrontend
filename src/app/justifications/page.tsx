"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { JustificationReviewContent } from "@/components/absence/justification-review-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"

export default function JustificationsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ProtectedRoute allowedRoles={[UserRole.TEACHER, UserRole.EDUCATION_MANAGER]}>
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
            title="Justification Requests"
            description="Review and validate student absence justifications submitted for your sessions."
          />

          <div className="mt-6">
            <JustificationReviewContent />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
