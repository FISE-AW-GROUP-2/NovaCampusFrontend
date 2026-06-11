import type { NextRequest } from "next/server"
import { proxyToSchedules } from "@/lib/api/schedules-proxy"

// GET /api/schedules/conflicts            -> backend GET {BACKEND}/schedules/conflicts
// GET /api/schedules/conflicts?resolved=  -> forwarded as-is
// Teacher only: lists conflict logs for the authenticated teacher's schedules.
export async function GET(request: NextRequest) {
  return proxyToSchedules(request, "/schedules/conflicts")
}
