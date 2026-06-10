import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToSchedules } from "@/lib/api/schedules-proxy"

// BACKEND URL already includes the "/api" segment, so backend paths here must
// NOT repeat it (otherwise the URL becomes /api/api/schedules).
// GET    /api/schedules        -> backend GET    {BACKEND}/schedules
// POST   /api/schedules        -> backend POST   {BACKEND}/schedules
// PUT    /api/schedules        -> backend PUT    {BACKEND}/schedules/{scheduleId}
// DELETE /api/schedules        -> backend DELETE {BACKEND}/schedules/{scheduleId}
//
// No dynamic route segments are used. The scheduleId is read from the query
// string or JSON body and injected into the backend path here.
export async function GET(request: NextRequest) {
  return proxyToSchedules(request, "/schedules")
}

export async function POST(request: NextRequest) {
  // Per the sequence diagram the backend validates room + teacher conflicts and
  // may respond 409 with suggestions. The proxy passes that through untouched.
  return proxyToSchedules(request, "/schedules")
}

export async function PUT(request: NextRequest) {
  let scheduleId =
    request.nextUrl.searchParams.get("scheduleId") || request.nextUrl.searchParams.get("id")

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
      { message: "scheduleId query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToSchedules(request, `/schedules/${encodeURIComponent(scheduleId)}`)
}

export async function DELETE(request: NextRequest) {
  const scheduleId =
    request.nextUrl.searchParams.get("scheduleId") || request.nextUrl.searchParams.get("id")
  if (scheduleId) {
    return proxyToSchedules(request, `/schedules/${encodeURIComponent(scheduleId)}`)
  }
  return proxyToSchedules(request, "/schedules")
}
