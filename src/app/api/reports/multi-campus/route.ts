import type { NextRequest } from "next/server"
import { proxyToReports } from "@/lib/api/reports-proxy"

// Multi-campus comparative report (Central Admin).
// GET /api/reports/multi-campus -> backend GET {BACKEND}/reports/multi-campus
//   ?academicYear=...&semester=... forwarded via the query string.
export async function GET(request: NextRequest) {
  return proxyToReports(request, "/reports/multi-campus")
}
