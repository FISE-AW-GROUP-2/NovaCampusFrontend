import type { NextRequest } from "next/server"
import { proxyBinaryToReports } from "@/lib/api/reports-proxy"

// Strategic report PDF export (Central Admin).
// GET /api/reports/strategic-export -> backend GET {BACKEND}/reports/strategic/export
//   The backend generates the PDF; the binary body and download headers are
//   passed through so the browser can save the file.
export async function GET(request: NextRequest) {
  return proxyBinaryToReports(request, "/reports/strategic/export")
}
