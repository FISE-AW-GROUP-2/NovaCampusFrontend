import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToSchedules } from "@/lib/api/schedules-proxy"

// PATCH /api/schedules/resolve?id=X -> backend PATCH {BACKEND}/schedules/{id}/resolve
// Teacher only: moves the schedule to a proposed free slot and marks its open
// conflicts resolved. The scheduleId is read from the query string or body.
export async function PATCH(request: NextRequest) {
  let scheduleId =
    request.nextUrl.searchParams.get("id") || request.nextUrl.searchParams.get("scheduleId")

  if (!scheduleId) {
    try {
      const text = await request.clone().text()
      if (text) {
        const body = JSON.parse(text)
        scheduleId = body.scheduleId || body.id || body._id
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!scheduleId) {
    return NextResponse.json(
      { message: "id query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToSchedules(request, `/schedules/${encodeURIComponent(scheduleId)}/resolve`)
}
