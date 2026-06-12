"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-notifications"
import { notificationTypeConfig } from "@/types/notification"
import { cn } from "@/lib/utils"
import { Bell, CheckCheck, Inbox } from "lucide-react"

function timeAgo(iso: string): string {
  const date = new Date(iso).getTime()
  if (Number.isNaN(date)) return ""
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// Bell + dropdown inbox in the header; live-updated over Socket.io.
export function NotificationBell() {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault()
                markAllRead()
              }}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const cfg =
                notificationTypeConfig[notification.type] ?? notificationTypeConfig.system
              return (
                <li key={notification._id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b last:border-b-0 hover:bg-accent transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!notification.read) markRead(notification._id)
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className={cn("text-[10px]", cfg.color)}>
                        {cfg.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {timeAgo(notification.createdAt)}
                      </span>
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs",
                        notification.read ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {notification.message}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
