import type { NextRequest } from "next/server"
import { proxyToReports } from "@/lib/api/reports-proxy"

// Central Admin dashboard KPIs (one CampusSnapshot per campus).
// GET /api/reports/dashboard -> backend GET {BACKEND}/reports/dashboard
export async function GET(request: NextRequest) {
  return proxyToReports(request, "/reports/dashboard")
}
