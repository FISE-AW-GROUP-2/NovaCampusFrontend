import { SessionsList } from "@/components/settings/sessions-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SessionsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Session Management</h1>
          <p className="text-muted-foreground">
            View and manage your active sessions across all devices.
          </p>
        </div>
        <SessionsList />
      </div>
    </ProtectedRoute>
  )
}
