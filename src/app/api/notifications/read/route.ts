import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToNotifications } from "@/lib/api/notifications-proxy"

// Mark a single notification as read.
// PATCH /api/notifications/read?id=... -> backend PATCH {BACKEND}/notifications/:id/read
export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ message: "Missing notification id" }, { status: 400 })
  }
  return proxyToNotifications(request, `/notifications/${encodeURIComponent(id)}/read`)
}
