import type { NextRequest } from "next/server"
import { proxyToNotifications } from "@/lib/api/notifications-proxy"

// Mark every notification of the authenticated user as read.
// PATCH /api/notifications/read-all -> backend PATCH {BACKEND}/notifications/read-all
export async function PATCH(request: NextRequest) {
  return proxyToNotifications(request, "/notifications/read-all")
}
