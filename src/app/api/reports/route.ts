import type { NextRequest } from "next/server"
import { proxyToReports } from "@/lib/api/reports-proxy"

// Generated reports history (Central Admin).
// GET /api/reports          -> backend GET {BACKEND}/reports
// GET /api/reports?id=...   -> backend GET {BACKEND}/reports/:id
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (id) {
    return proxyToReports(request, `/reports/${encodeURIComponent(id)}`)
  }
  return proxyToReports(request, "/reports")
}
