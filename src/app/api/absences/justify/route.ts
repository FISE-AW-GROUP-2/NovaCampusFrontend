import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyFormToAbsences } from "@/lib/api/absences-proxy"

// Student submits a justification (reason + uploaded document) for an absence.
// POST /api/absences/justify?id=X
//   -> backend POST {BACKEND}/absences/{id}/justify  (multipart/form-data via multer)
//
// The absenceId is read from the query string (no dynamic segment) and injected
// into the backend path. The multipart body (reason + file) is forwarded with
// its boundary preserved. The backend enforces the 7-day justification window
// and ownership checks, and may return 400 on failure.
export async function POST(request: NextRequest) {
  const absenceId =
    request.nextUrl.searchParams.get("id") || request.nextUrl.searchParams.get("absenceId")
  if (!absenceId) {
    return NextResponse.json(
      { message: "absenceId query parameter is required" },
      { status: 400 }
    )
  }
  return proxyFormToAbsences(request, `/absences/${encodeURIComponent(absenceId)}/justify`)
}
