import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToSchedules } from "@/lib/api/schedules-proxy"

// GET /api/schedules/sessions?id=X -> backend GET {BACKEND}/schedules/{id}/sessions
// Returns the concrete occurrence dates generated from the schedule's
// recurrence rule. The scheduleId is read from the query string (no dynamic
// route segments are used on the client).
export async function GET(request: NextRequest) {
  const scheduleId =
    request.nextUrl.searchParams.get("id") || request.nextUrl.searchParams.get("scheduleId")
  if (!scheduleId) {
    return NextResponse.json(
      { message: "id query parameter is required" },
      { status: 400 }
    )
  }
  return proxyToSchedules(request, `/schedules/${encodeURIComponent(scheduleId)}/sessions`)
}
