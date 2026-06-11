import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Justification review queue + validation.
// GET   /api/justifications              -> backend GET {BACKEND}/justifications
//   Reviewer-scoped (Teacher / Education Manager). Optional ?decision filter
//   (pending|approved|rejected) is forwarded as-is.
// PATCH /api/justifications?id=X         -> backend PATCH {BACKEND}/justifications/{id}
//   Body: { decision: "approved" | "rejected", rejectionNote? }.
//
// No dynamic route segments are used; the justification id is read from the
// query string and injected into the backend path here.
export async function GET(request: NextRequest) {
  return proxyToAbsences(request, "/justifications")
}

export async function PATCH(request: NextRequest) {
  let justificationId =
    request.nextUrl.searchParams.get("id") ||
    request.nextUrl.searchParams.get("justificationId")

  if (!justificationId) {
    try {
      const text = await request.clone().text()
      if (text) {
        const body = JSON.parse(text)
        justificationId = body.id || body._id || body.justificationId
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!justificationId) {
    return NextResponse.json(
      { message: "justificationId query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToAbsences(request, `/justifications/${encodeURIComponent(justificationId)}`)
}
