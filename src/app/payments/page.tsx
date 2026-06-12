"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { EducationManagerPaymentsContent } from "@/components/payments/education-manager-payments-content"
import { StudentPaymentsContent } from "@/components/payments/student-payments-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"

// Education Managers manage payments; Students get a read-only view of their
// own (the backend scopes the data, the page just switches the UI).
export default function PaymentsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()
  const isStudent = user?.role === UserRole.STUDENT

  return (
    <ProtectedRoute allowedRoles={[UserRole.EDUCATION_MANAGER, UserRole.STUDENT]}>
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
            title={isStudent ? "My Payments" : "Payment Tracking"}
            description={
              isStudent
                ? "Review your tuition payments, due dates and payment history."
                : "Track student payments, mark them as paid and send reminders."
            }
          />

          <div className="mt-6">
            {isStudent ? <StudentPaymentsContent /> : <EducationManagerPaymentsContent />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
