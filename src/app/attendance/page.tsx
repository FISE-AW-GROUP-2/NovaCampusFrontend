"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { CheckInContent } from "@/components/absence/check-in-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"

export default function CheckInPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
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
            title="Attendance Check-in"
            description="Scan the session QR code within the first few minutes of class to mark yourself present."
          />

          <div className="mt-6">
            <CheckInContent />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
