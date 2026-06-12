import type { NextRequest } from "next/server"
import { proxyBinaryToGrades } from "@/lib/api/grades-proxy"

// Student PDF transcript export.
// GET /api/grades/my/export -> backend GET {BACKEND}/grades/my/export
//   The backend generates the PDF; the binary body and download headers are
//   passed through so the browser can save the file.
export async function GET(request: NextRequest) {
  return proxyBinaryToGrades(request, "/grades/my/export")
}
