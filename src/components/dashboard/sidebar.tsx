"use client"

import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Bot,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  UserPlus,
  DoorOpen,
  CalendarPlus,
  UserCog,
  QrCode,
  CalendarX2,
  ClipboardCheck,
  CreditCard,
  NotebookPen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"

// Create context for sidebar collapse state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const menuItems: Array<{
  icon: typeof LayoutDashboard
  label: string
  href: string
  badge?: string
}> = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Schedule", href: "/calendar" },
]

// Course items based on user role
const getCourseItems = (role?: UserRole) => {
  const items: Array<{ icon: typeof BookOpen; label: string; href: string; badge?: string }> = []
  
  if (role === UserRole.TEACHER || role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: BookOpen, label: "Manage Courses", href: "/courses/teacher" })
  }
  
  if (role === UserRole.EDUCATION_MANAGER || role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: UserPlus, label: "Enrollments", href: "/courses/enrollments" })
  }
  
  if (role === UserRole.STUDENT || role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: GraduationCap, label: "Browse Courses", href: "/courses/browse" })
  }
  
  return items
}

// Administration items based on user role
const getAdminItems = (role?: UserRole) => {
  const items: Array<{ icon: typeof BookOpen; label: string; href: string; badge?: string }> = []

  if (role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: UserCog, label: "Accounts & Profiles", href: "/team" })
    items.push({ icon: BarChart3, label: "Reports", href: "/reports" })
  }

  return items
}

// Academic items (Grade + Payment services) based on user role
const getAcademicItems = (role?: UserRole) => {
  const items: Array<{ icon: typeof BookOpen; label: string; href: string; badge?: string }> = []

  if (role === UserRole.TEACHER) {
    items.push({ icon: NotebookPen, label: "Manage Grades", href: "/grades/manage" })
  }

  if (role === UserRole.STUDENT) {
    items.push({ icon: GraduationCap, label: "My Grades", href: "/grades" })
    items.push({ icon: CreditCard, label: "My Payments", href: "/payments" })
  }

  if (role === UserRole.EDUCATION_MANAGER) {
    items.push({ icon: CreditCard, label: "Payments", href: "/payments" })
  }

  return items
}

// Attendance / Absence items based on user role
const getAttendanceItems = (role?: UserRole) => {
  const items: Array<{ icon: typeof BookOpen; label: string; href: string; badge?: string }> = []

  if (role === UserRole.STUDENT) {
    items.push({ icon: QrCode, label: "Check-in", href: "/attendance" })
    items.push({ icon: CalendarX2, label: "My Absences", href: "/absences" })
  }

  if (role === UserRole.TEACHER || role === UserRole.EDUCATION_MANAGER) {
    items.push({ icon: ClipboardCheck, label: "Justifications", href: "/justifications" })
  }

  return items
}

// Room items based on user role
const getRoomItems = (role?: UserRole) => {
  const items: Array<{ icon: typeof BookOpen; label: string; href: string; badge?: string }> = []

  if (role === UserRole.TEACHER || role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: CalendarPlus, label: "Book a Room", href: "/rooms/book" })
  }

  if (role === UserRole.EDUCATION_MANAGER || role === UserRole.CENTRAL_ADMIN) {
    items.push({ icon: DoorOpen, label: "Manage Rooms", href: "/rooms/manage" })
  }

  return items
}

const aiItems = [
  { icon: Bot, label: "AI Assistant", badge: "New", href: "/ai-assistant" },
]

const generalItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]

export function Sidebar({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void } = {}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()
  const { user } = useAuth()
  const courseItems = getCourseItems(user?.role)
  const roomItems = getRoomItems(user?.role)
  const adminItems = getAdminItems(user?.role)
  const attendanceItems = getAttendanceItems(user?.role)
  const academicItems = getAcademicItems(user?.role)

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bg-sidebar border-r border-sidebar-border h-screen overflow-y-auto lg:block transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("p-4", isCollapsed && "px-2")}>
        <div className={cn("mb-6 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <Link href="/">
              <div>
                <span className="text-base font-bold text-sidebar-foreground">NovaCampus</span>
              </div>
            </Link>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className={cn(
                "h-7 w-7 rounded-lg hover:bg-sidebar-accent",
                isCollapsed && "mx-auto",
              )}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                WORKSPACE
              </p>
            )}
            <nav className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {courseItems.length > 0 && (
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                  COURSES
                </p>
              )}
              <nav className="space-y-0.5">
                {courseItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {academicItems.length > 0 && (
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                  ACADEMIC
                </p>
              )}
              <nav className="space-y-0.5">
                {academicItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {roomItems.length > 0 && (
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                  ROOMS
                </p>
              )}
              <nav className="space-y-0.5">
                {roomItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {attendanceItems.length > 0 && (
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                  ATTENDANCE
                </p>
              )}
              <nav className="space-y-0.5">
                {attendanceItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          {adminItems.length > 0 && (
            <div>
              {!isCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                  ADMINISTRATION
                </p>
              )}
              <nav className="space-y-0.5">
                {adminItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                        isCollapsed && "justify-center",
                      )}
                    >
                      <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}

          <div>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                AI TOOLS
              </p>
            )}
            <nav className="space-y-0.5">
              {aiItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-muted text-foreground text-[10px] font-medium px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide px-2">
                GENERAL
              </p>
            )}
            <nav className="space-y-0.5">
              {generalItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-normal transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isCollapsed && "w-4.5 h-4.5")} />
                    {!isCollapsed && <span className="text-sm">{item.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  )
}
