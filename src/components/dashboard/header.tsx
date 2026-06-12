"use client"

import { Search, Mail, QrCode } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileNav } from "./mobile-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import type { ReactNode } from "react"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

function initials(name?: string, email?: string): string {
  const source = name?.trim() || email || ""
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const result = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  return result.toUpperCase() || "?"
}

export function Header({ title, description, actions }: HeaderProps) {
  const { user } = useAuth()
  const isStudent = user?.role === UserRole.STUDENT

  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MobileNav />

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search"
              className="pl-9 pr-3 h-9 text-sm bg-card border-border rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStudent && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              title="Attendance check-in"
            >
              <Link href="/attendance">
                <QrCode className="w-4 h-4" />
                <span className="sr-only">Attendance check-in</span>
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
          >
            <Mail className="w-4 h-4" />
          </Button>
          <NotificationBell />

          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
            <Avatar className="w-8 h-8">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || "Profile"} />}
              <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium">
                {initials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs hidden lg:block">
              <p className="font-medium text-foreground">{user?.name || user?.email || ""}</p>
              <p className="text-muted-foreground text-[10px]">{user?.role || ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {actions && <div className="flex flex-col sm:flex-row gap-2">{actions}</div>}
    </header>
  )
}
