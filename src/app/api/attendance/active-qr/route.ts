import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Returns the currently active QR code for a given schedule session, so the
// student app can render it (within the first ~10-15 min of the session).
// GET /api/attendance/active-qr?scheduleId=X -> backend GET {BACKEND}/attendance/active-qr?scheduleId=X
// The scheduleId is forwarded as-is via the query string (no dynamic segment).
export async function GET(request: NextRequest) {
  return proxyToAbsences(request, "/attendance/active-qr")
}
