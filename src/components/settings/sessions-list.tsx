"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Loader2,
  LogOut,
  Shield,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import type { Session } from "@/types/auth"

function getDeviceIcon(device: string) {
  const deviceLower = device.toLowerCase()
  if (deviceLower.includes("mobile") || deviceLower.includes("phone")) {
    return <Smartphone className="h-5 w-5" />
  }
  if (deviceLower.includes("tablet") || deviceLower.includes("ipad")) {
    return <Tablet className="h-5 w-5" />
  }
  return <Monitor className="h-5 w-5" />
}

function SessionItem({
  session,
  onRevoke,
  isRevoking,
}: {
  session: Session
  onRevoke: (id: string) => void
  isRevoking: boolean
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
        session.isCurrent ? "border-primary/50 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {getDeviceIcon(session.device)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{session.browser}</span>
            {session.isCurrent && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <CheckCircle className="h-3 w-3" />
                Current
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{session.device}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{session.ipAddress}</span>
            {session.location && <span>- {session.location}</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            Last active {formatDistanceToNow(new Date(session.lastActive), { addSuffix: true })}
          </p>
        </div>
      </div>
      {!session.isCurrent && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isRevoking}>
              {isRevoking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="sr-only">Revoke session</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign out the device associated with this session. They will need to sign in
                again to access their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRevoke(session.id)}>
                Revoke session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

export function SessionsList() {
  const { sessions, sessionsLoading, fetchSessions, revokeSession, revokeAllOtherSessions } =
    useAuth()
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleRevokeSession = async (sessionId: string) => {
    setError("")
    setRevokingId(sessionId)
    const result = await revokeSession(sessionId)
    if (!result.success) {
      setError(result.error || "Failed to revoke session")
    }
    setRevokingId(null)
  }

  const handleRevokeAllOthers = async () => {
    setError("")
    setRevokingAll(true)
    const result = await revokeAllOtherSessions()
    if (!result.success) {
      setError(result.error || "Failed to revoke sessions")
    }
    setRevokingAll(false)
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent)

  if (sessionsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Active Sessions</CardTitle>
        </div>
        <CardDescription>
          Manage your active sessions across different devices. You can sign out of any session you
          don&apos;t recognize.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {sessions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No active sessions found.</p>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  onRevoke={handleRevokeSession}
                  isRevoking={revokingId === session.id}
                />
              ))}
            </div>

            {otherSessions.length > 0 && (
              <div className="border-t pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={revokingAll}>
                      {revokingAll ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out all other sessions
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will sign out {otherSessions.length} other{" "}
                        {otherSessions.length === 1 ? "session" : "sessions"}. Those devices will
                        need to sign in again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeAllOthers}>
                        Sign out all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
