import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Absence records (student view).
// GET /api/absences -> backend GET {BACKEND}/absences/my
//   The backend scopes results to the authenticated student. Optional filters
//   (?status=...&courseId=...) are forwarded as-is via the query string.
export async function GET(request: NextRequest) {
  return proxyToAbsences(request, "/absences/my")
}
