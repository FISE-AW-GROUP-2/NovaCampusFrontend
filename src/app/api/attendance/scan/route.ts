import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToAbsences } from "@/lib/api/absences-proxy"

// Student scans a QR code to mark attendance.
// POST /api/attendance/scan -> backend POST {BACKEND}/attendance/scan
// Body: { qrToken }. The backend validates the token (not expired / not used),
// creates an AttendanceScan with status "present", and may return:
//   200 "Attendance recorded", 400 "QR invalid or expired", 409 "Already checked in".
export async function POST(request: NextRequest) {
  return proxyToAbsences(request, "/attendance/scan")
}
