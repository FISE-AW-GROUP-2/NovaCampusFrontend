import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToRooms } from "@/lib/api/rooms-proxy"

// POST /api/rooms/book { roomId, date, startTime, endTime, courseId }
//   -> backend POST {BACKEND}/rooms/{roomId}/book { date, startTime, endTime, courseId }
//
// Per the sequence diagram the backend route is POST /api/rooms/:id/book, but
// the frontend avoids dynamic route segments. The roomId is read from the JSON
// body and injected into the backend path here. A 409 from the backend means
// the room is no longer available for the requested slot.
export async function POST(request: NextRequest) {
  let roomId: string | undefined
  try {
    const text = await request.clone().text()
    if (text) {
      const body = JSON.parse(text)
      roomId = body.roomId || body.id || body._id
    }
  } catch {
    // ignore parse errors
  }

  if (!roomId) {
    return NextResponse.json({ message: "roomId is required in the request body" }, { status: 400 })
  }

  return proxyToRooms(request, `/rooms/book/${encodeURIComponent(roomId)}`)
}
