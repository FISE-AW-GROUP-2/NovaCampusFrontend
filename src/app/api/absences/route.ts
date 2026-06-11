import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Absence records.
// GET /api/absences            -> backend GET {BACKEND}/absences
//   Role-scoped by the backend: a student receives only their own records.
//   Optional filters (status, courseId) are forwarded as-is.
// GET /api/absences?id=X       -> backend GET {BACKEND}/absences/{id}
//
// No dynamic route segments are used; the id is read from the query string.
export async function GET(request: NextRequest) {
  const absenceId =
    request.nextUrl.searchParams.get("id") || request.nextUrl.searchParams.get("absenceId")
  if (absenceId) {
    return proxyToAbsences(request, `/absences/${encodeURIComponent(absenceId)}`)
  }
  return proxyToAbsences(request, "/absences")
}
