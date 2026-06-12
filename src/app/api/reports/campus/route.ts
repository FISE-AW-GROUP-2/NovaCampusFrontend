import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToReports } from "@/lib/api/reports-proxy"

// Campus drill-down report (Central Admin).
// GET /api/reports/campus?campusId=... -> backend GET {BACKEND}/reports/campus/:campusId
export async function GET(request: NextRequest) {
  const campusId = request.nextUrl.searchParams.get("campusId")
  if (!campusId) {
    return NextResponse.json({ message: "Missing campusId" }, { status: 400 })
  }
  return proxyToReports(request, `/reports/campus/${encodeURIComponent(campusId)}`)
}
