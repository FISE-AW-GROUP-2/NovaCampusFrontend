import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToRooms } from "@/lib/api/rooms-proxy"

// BACKEND URL already includes the "/api" segment, so backend paths here must
// NOT repeat it (otherwise the URL becomes /api/api/rooms).
// GET    /api/rooms        -> backend GET    {BACKEND}/rooms
// POST   /api/rooms        -> backend POST   {BACKEND}/rooms
// PUT    /api/rooms        -> backend PUT    {BACKEND}/rooms/{roomId}
// DELETE /api/rooms        -> backend DELETE {BACKEND}/rooms/{roomId}
export async function GET(request: NextRequest) {
  return proxyToRooms(request, "/rooms")
}

export async function POST(request: NextRequest) {
  return proxyToRooms(request, "/rooms")
}

export async function PUT(request: NextRequest) {
  // Accept roomId from query parameter or JSON body (no dynamic route segment).
  let roomId = request.nextUrl.searchParams.get("roomId") || request.nextUrl.searchParams.get("id")

  if (!roomId) {
    try {
      const text = await request.clone().text()
      if (text) {
        const body = JSON.parse(text)
        roomId = body.roomId || body.id || body._id
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!roomId) {
    return NextResponse.json(
      { message: "roomId query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToRooms(request, `/rooms/${encodeURIComponent(roomId)}`)
}

export async function DELETE(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId") || request.nextUrl.searchParams.get("id")
  if (roomId) {
    return proxyToRooms(request, `/rooms/${encodeURIComponent(roomId)}`)
  }
  return proxyToRooms(request, "/rooms")
}
