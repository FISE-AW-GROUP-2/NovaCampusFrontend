"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AssistantChat } from "@/components/ai-assistant/assistant-chat"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Ollama-backed campus assistant — available to every authenticated role.
export default function AIAssistantPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <ProtectedRoute>
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
            title="AI Assistant"
            description="Ask the campus assistant about courses, grades, absences, schedules and payments."
          />

          <div className="mt-6">
            <AssistantChat />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
