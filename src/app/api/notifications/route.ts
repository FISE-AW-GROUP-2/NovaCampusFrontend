import type { NextRequest } from "next/server"
import { proxyToNotifications } from "@/lib/api/notifications-proxy"

// Notification inbox (all authenticated roles).
// GET /api/notifications -> backend GET {BACKEND}/notifications
export async function GET(request: NextRequest) {
  return proxyToNotifications(request, "/notifications")
}
