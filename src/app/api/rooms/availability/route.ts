import type { NextRequest } from "next/server"
import { proxyToRooms } from "@/lib/api/rooms-proxy"

// GET /api/rooms/availability?date=&start=&end=&campusId=
//   -> backend GET {BACKEND}/rooms/availability?...
// Matches the sequence diagram: Room Service filters rooms by campus and
// removes those with conflicting bookings for the requested slot.
export async function GET(request: NextRequest) {
  return proxyToRooms(request, "/rooms/availability")
}
