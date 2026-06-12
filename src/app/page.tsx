"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ReportsDashboardContent } from "@/components/reports/reports-dashboard-content"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"
import {
  BookOpen,
  Calendar,
  CalendarPlus,
  CalendarX2,
  ClipboardCheck,
  CreditCard,
  DoorOpen,
  GraduationCap,
  NotebookPen,
  QrCode,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

interface QuickLink {
  icon: LucideIcon
  label: string
  description: string
  href: string
}

// Quick-access shortcuts per role for the non-admin home page.
const QUICK_LINKS: Partial<Record<UserRole, QuickLink[]>> = {
  [UserRole.STUDENT]: [
    { icon: GraduationCap, label: "My Grades", description: "View your grades and export your transcript", href: "/grades" },
    { icon: CreditCard, label: "My Payments", description: "Review tuition payments and due dates", href: "/payments" },
    { icon: BookOpen, label: "Browse Courses", description: "Explore the course catalog", href: "/courses/browse" },
    { icon: QrCode, label: "Check-in", description: "Scan the session QR code to mark attendance", href: "/attendance" },
    { icon: CalendarX2, label: "My Absences", description: "Review absences and submit justifications", href: "/absences" },
    { icon: Calendar, label: "Schedule", description: "See your upcoming sessions", href: "/calendar" },
  ],
  [UserRole.TEACHER]: [
    { icon: NotebookPen, label: "Manage Grades", description: "Add, edit and remove student grades", href: "/grades/manage" },
    { icon: BookOpen, label: "Manage Courses", description: "Your courses and their resources", href: "/courses/teacher" },
    { icon: ClipboardCheck, label: "Justifications", description: "Review pending absence justifications", href: "/justifications" },
    { icon: CalendarPlus, label: "Book a Room", description: "Reserve a room for your sessions", href: "/rooms/book" },
    { icon: Calendar, label: "Schedule", description: "See your teaching schedule", href: "/calendar" },
  ],
  [UserRole.EDUCATION_MANAGER]: [
    { icon: CreditCard, label: "Payments", description: "Track student payments and send reminders", href: "/payments" },
    { icon: UserPlus, label: "Enrollments", description: "Enroll students into courses", href: "/courses/enrollments" },
    { icon: DoorOpen, label: "Manage Rooms", description: "Manage rooms and their bookings", href: "/rooms/manage" },
    { icon: ClipboardCheck, label: "Justifications", description: "Review pending absence justifications", href: "/justifications" },
    { icon: Calendar, label: "Schedule", description: "Manage the campus schedule", href: "/calendar" },
  ],
}

function QuickAccessGrid({ role }: { role?: UserRole }) {
  const links = (role && QUICK_LINKS[role]) || []

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="p-5 h-full hover:border-primary/50 hover:shadow-md transition-all">
            <link.icon className="h-6 w-6 text-primary mb-3" />
            <p className="font-medium text-sm mb-1">{link.label}</p>
            <p className="text-xs text-muted-foreground">{link.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// Central Admin lands on the multi-campus reporting dashboard; other roles
// get quick access to their own service pages.
export default function DashboardPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.CENTRAL_ADMIN

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
        </div>

        <main
          className={cn(
            "flex-1 p-4 md:p-5 lg:p-6 transition-all duration-300",
            isCollapsed ? "lg:ml-16" : "lg:ml-60",
          )}
        >
          <Header
            title={
              isAdmin
                ? "Multi-Campus Dashboard"
                : `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`
            }
            description={
              isAdmin
                ? "Compare campuses, analyse success rates and export strategic reports."
                : "Quick access to your most used pages."
            }
          />

          <div className="mt-6">
            {isAdmin ? <ReportsDashboardContent /> : <QuickAccessGrid role={user?.role} />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
