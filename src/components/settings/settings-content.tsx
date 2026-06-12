"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getUserByIdApi, updateUserApi } from "@/lib/api/users"
import { roleConfig } from "@/lib/constants"

function initials(name?: string, email?: string): string {
  const source = name?.trim() || email || ""
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const result = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
  return result.toUpperCase() || "?"
}

export function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { toast } = useToast()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load the full account document (the session only carries id/name/email)
  // so the profile fields reflect what is stored in the backend.
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getUserByIdApi(user.id)
      .then((result) => {
        if (cancelled) return
        if (result.success && result.data) {
          setFirstName(result.data.profile?.firstName ?? "")
          setLastName(result.data.profile?.lastName ?? "")
          setEmail(result.data.email ?? user.email ?? "")
        } else {
          // Fall back to the session data
          const parts = (user.name ?? "").split(" ")
          setFirstName(parts[0] ?? "")
          setLastName(parts.slice(1).join(" "))
          setEmail(user.email ?? "")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.name, user?.email])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSaving(true)
    try {
      const result = await updateUserApi(user.id, {
        email,
        firstName,
        lastName,
      })
      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been saved.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update your profile.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const roleCfg = user?.role ? roleConfig[user.role] : undefined
  const displayName = `${firstName} ${lastName}`.trim() || user?.name

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Profile Information</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                {user?.avatar && <AvatarImage src={user.avatar} alt={displayName || "Profile"} />}
                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-medium">
                  {initials(displayName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {roleCfg && (
                  <Badge
                    variant="secondary"
                    className={`mt-1.5 ${roleCfg.bgColor} ${roleCfg.color}`}
                  >
                    {roleCfg.label}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving && <Spinner className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Enable dark mode theme</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
