import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Returns the QR code of the session currently starting, so the student app
// can render it (backend only serves it during the first ~10 min of the session).
// GET /api/attendance/active-qr?scheduleId=X -> backend GET {BACKEND}/absences/qr/{scheduleId}
// The scheduleId is read from the query string and injected into the backend path.
export async function GET(request: NextRequest) {
  const scheduleId = request.nextUrl.searchParams.get("scheduleId")
  if (!scheduleId) {
    return NextResponse.json(
      { message: "scheduleId query parameter is required" },
      { status: 400 }
    )
  }
  return proxyToAbsences(request, `/absences/qr/${encodeURIComponent(scheduleId)}`)
}
