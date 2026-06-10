"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserFormDialog } from "./user-form-dialog"
import { useToast } from "@/hooks/use-toast"
import { getUsersApi, deleteUserApi } from "@/lib/api/users"
import { UserRole } from "@/types/auth"
import { roleConfig } from "@/lib/constants"
import { getUserDisplayName, type ManagedUser } from "@/types/user"
import { Plus, Search, Users, MoreVertical, Pencil, Trash2, Mail } from "lucide-react"

const ROLE_OPTIONS: Array<UserRole | "all"> = ["all", ...Object.values(UserRole)]

function initials(user: ManagedUser): string {
  const name = getUserDisplayName(user)
  const parts = name.split(/[\s@.]+/).filter(Boolean)
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")
}

export function UserManagementContent() {
  const { toast } = useToast()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getUsersApi({
        search: search || undefined,
        role,
      })
      if (result.success && result.data) {
        setUsers(result.data.users)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch users",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [search, role, toast])

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300)
    return () => clearTimeout(debounce)
  }, [fetchUsers])

  const handleSuccess = (user: ManagedUser) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id)
      return exists ? prev.map((u) => (u._id === user._id ? user : u)) : [user, ...prev]
    })
    setEditing(null)
  }

  const handleEdit = (user: ManagedUser) => {
    setEditing(user)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteUserApi(deleteTarget._id)
    if (result.success) {
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id))
      toast({ title: "User deleted", description: `${deleteTarget.email} has been removed.` })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete user",
        variant: "destructive",
      })
    }
    setDeleteTarget(null)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) setEditing(null)
    setShowForm(open)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={role} onValueChange={(v) => setRole(v as UserRole | "all")}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "all" ? "All Roles" : roleConfig[opt].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            {search || role !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first user account"}
          </p>
          {!search && role === "all" && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden lg:table-cell">Campus</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const config = roleConfig[user.role]
                return (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground font-medium uppercase">
                            {initials(user) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{getUserDisplayName(user)}</p>
                          <p className="text-xs text-muted-foreground truncate md:hidden">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${config?.bgColor ?? ""} ${config?.color ?? ""}`}>
                        {config?.label ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {user.campusId ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {user.isActive === false ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">User actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <UserFormDialog
        open={showForm}
        onOpenChange={handleFormClose}
        user={editing}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.email}&apos;s account and all associated
              sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
