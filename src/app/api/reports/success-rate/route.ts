import type { NextRequest } from "next/server"
import { proxyToReports } from "@/lib/api/reports-proxy"

// Success-rate analysis (Central Admin).
// GET /api/reports/success-rate -> backend GET {BACKEND}/reports/success-rate
export async function GET(request: NextRequest) {
  return proxyToReports(request, "/reports/success-rate")
}
