import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  Settings,
  BarChart3,
  UserCog,
  School,
  FileText,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { UserRole } from "@/types/auth"

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

// Navigation items organized by section with role-based access
export const navigationSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "User Management",
        href: "/admin/users",
        icon: UserCog,
        roles: [UserRole.CENTRAL_ADMIN],
      },
      {
        title: "Schools",
        href: "/admin/schools",
        icon: School,
        roles: [UserRole.CENTRAL_ADMIN],
      },
      {
        title: "Reports",
        href: "/admin/reports",
        icon: BarChart3,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: [UserRole.CENTRAL_ADMIN],
      },
    ],
  },
  {
    title: "Academic",
    items: [
      {
        title: "Curriculum",
        href: "/academic/curriculum",
        icon: BookOpen,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER],
      },
      {
        title: "Teachers",
        href: "/academic/teachers",
        icon: Users,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER],
      },
      {
        title: "Students",
        href: "/academic/students",
        icon: GraduationCap,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER],
      },
    ],
  },
  {
    title: "Teaching",
    items: [
      {
        title: "My Classes",
        href: "/classes",
        icon: BookOpen,
        roles: [UserRole.TEACHER],
      },
      {
        title: "Attendance",
        href: "/classes/attendance",
        icon: ClipboardList,
        roles: [UserRole.TEACHER],
      },
      {
        title: "Grades",
        href: "/classes/grades",
        icon: FileText,
        roles: [UserRole.TEACHER],
      },
    ],
  },
  {
    title: "My Portal",
    items: [
      {
        title: "My Courses",
        href: "/portal/courses",
        icon: BookOpen,
        roles: [UserRole.STUDENT],
      },
      {
        title: "My Grades",
        href: "/portal/grades",
        icon: FileText,
        roles: [UserRole.STUDENT],
      },
      {
        title: "Schedule",
        href: "/portal/schedule",
        icon: Calendar,
        roles: [UserRole.STUDENT],
      },
      {
        title: "Attendance",
        href: "/portal/attendance",
        icon: ClipboardList,
        roles: [UserRole.STUDENT],
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        title: "Calendar",
        href: "/calendar",
        icon: Calendar,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER],
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
      },
      {
        title: "Help",
        href: "/help",
        icon: HelpCircle,
        roles: [UserRole.CENTRAL_ADMIN, UserRole.EDUCATION_MANAGER, UserRole.TEACHER, UserRole.STUDENT],
      },
    ],
  },
]

// Role display names and colors
export const roleConfig: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  [UserRole.CENTRAL_ADMIN]: {
    label: "Central Admin",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  [UserRole.EDUCATION_MANAGER]: {
    label: "Education Manager",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  [UserRole.TEACHER]: {
    label: "Teacher",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  [UserRole.STUDENT]: {
    label: "Student",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
}

// JWT configuration
export const JWT_SECRET = "your-secret-key-change-in-production"
export const JWT_EXPIRY = "24h"
export const TOKEN_STORAGE_KEY = "school_erp_token"
