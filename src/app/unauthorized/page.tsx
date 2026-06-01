"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldAlert, ArrowLeft, Home, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { roleConfig } from "@/lib/constants"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()

  const userRoleConfig = user ? roleConfig[user.role] : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && userRoleConfig && (
              <div className="rounded-md bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">You are logged in as</p>
                <p className="font-medium text-foreground">{user.name}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${userRoleConfig.bgColor} ${userRoleConfig.color}`}
                >
                  {userRoleConfig.label}
                </span>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              This area is restricted to users with different access levels.
              If you believe this is an error, please contact your administrator.
            </p>

            <div className="flex flex-col gap-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back
              </Button>
              <Link href="/">
                <Button className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            <div className="border-t pt-4">
              <p className="text-center text-sm text-muted-foreground">
                Need help?{" "}
                <Link
                  href="mailto:support@school.edu"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
