"use client"

import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Bot,
  Sparkles,
  Wand2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

// Create context for sidebar collapse state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: CheckSquare, label: "Campaigns", badge: "12", href: "/tasks" },
  { icon: Calendar, label: "Schedule", href: "/calendar" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: FileText, label: "Templates", href: "/templates/new" },
]

const aiItems = [
  { icon: Bot, label: "AI Assistant", badge: "New", href: "/ai-assistant" },
  { icon: Sparkles, label: "Content Generator", href: "/content-generator" },
  { icon: Wand2, label: "Smart Suggestions", href: "/suggestions" },
]

const generalItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
  { icon: LogOut, label: "Logout", href: "/logout" },
]

export function Sidebar({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void } = {}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()

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
                <span className="text-base font-bold text-sidebar-foreground">CampaignHub</span>
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
