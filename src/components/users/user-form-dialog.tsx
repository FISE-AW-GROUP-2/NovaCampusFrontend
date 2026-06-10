"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { createUserApi, updateUserApi } from "@/lib/api/users"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/auth"
import { roleConfig } from "@/lib/constants"
import type { ManagedUser, CreateUserData, UpdateUserData } from "@/types/user"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: ManagedUser | null
  onSuccess?: (user: ManagedUser) => void
}

interface FormState {
  email: string
  password: string
  role: UserRole
  campusId: string
  firstName: string
  lastName: string
  phone: string
  isActive: boolean
}

const ROLE_OPTIONS = Object.values(UserRole)

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!user

  const buildDefault = (): FormState => ({
    email: "",
    password: "",
    role: UserRole.STUDENT,
    campusId: currentUser?.campusId ?? "",
    firstName: "",
    lastName: "",
    phone: "",
    isActive: true,
  })

  const [form, setForm] = useState<FormState>(buildDefault())

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email ?? "",
        password: "",
        role: user.role,
        campusId: user.campusId ?? "",
        firstName: user.profile?.firstName ?? "",
        lastName: user.profile?.lastName ?? "",
        phone: user.profile?.phone ?? "",
        isActive: user.isActive ?? true,
      })
    } else {
      setForm(buildDefault())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEditing && !form.password) {
      toast({
        title: "Password required",
        description: "A password is required when creating a new user.",
        variant: "destructive",
      })
      return
    }
    if (!form.campusId) {
      toast({
        title: "Campus required",
        description: "A campus ID is required.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      if (isEditing) {
        const payload: UpdateUserData = {
          email: form.email,
          role: form.role,
          campusId: form.campusId,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          isActive: form.isActive,
        }
        // Only send a password if the admin entered a new one.
        if (form.password) payload.password = form.password

        const result = await updateUserApi(user!._id, payload)
        if (result.success && result.data) {
          toast({ title: "User updated", description: `${form.email} has been updated.` })
          onSuccess?.(result.data)
          onOpenChange(false)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update user",
            variant: "destructive",
          })
        }
      } else {
        const payload: CreateUserData = {
          email: form.email,
          password: form.password,
          campusId: form.campusId,
          role: form.role,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        }
        const result = await createUserApi(payload)
        if (result.success && result.data) {
          toast({ title: "User created", description: `${form.email} has been created.` })
          onSuccess?.(result.data)
          onOpenChange(false)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create user",
            variant: "destructive",
          })
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this user's account details and role."
              : "Create a new account for any role across the campus."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane.doe@campus.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isEditing && <span className="text-muted-foreground">(leave blank to keep current)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={isEditing ? "••••••••" : "Enter a password"}
                required={!isEditing}
                autoComplete="new-password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value as UserRole })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleConfig[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusId">Campus ID</Label>
                <Input
                  id="campusId"
                  value={form.campusId}
                  onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                  placeholder="campus-001"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="isActive">Account Status</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
