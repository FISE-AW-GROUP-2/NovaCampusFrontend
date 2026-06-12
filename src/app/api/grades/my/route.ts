import type { NextRequest } from "next/server"
import { proxyToGrades } from "@/lib/api/grades-proxy"

// Student grade view.
// GET /api/grades/my -> backend GET {BACKEND}/grades/my
//   The backend scopes results to the authenticated student. Optional filters
//   (?semester=...&academicYear=...) are forwarded via the query string.
export async function GET(request: NextRequest) {
  return proxyToGrades(request, "/grades/my")
}
