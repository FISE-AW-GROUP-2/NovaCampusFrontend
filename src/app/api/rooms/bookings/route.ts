import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToRooms } from "@/lib/api/rooms-proxy"

// GET   /api/rooms/bookings?roomId=&courseId=&date= -> backend GET   {BACKEND}/rooms/bookings?...
// PATCH /api/rooms/bookings { bookingId, status }    -> backend PATCH {BACKEND}/rooms/bookings/{bookingId}
export async function GET(request: NextRequest) {
  return proxyToRooms(request, "/rooms/bookings")
}

export async function PATCH(request: NextRequest) {
  let bookingId = request.nextUrl.searchParams.get("bookingId")

  if (!bookingId) {
    try {
      const text = await request.clone().text()
      if (text) {
        const body = JSON.parse(text)
        bookingId = body.bookingId || body.id || body._id
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!bookingId) {
    return NextResponse.json(
      { message: "bookingId query parameter or body id is required" },
      { status: 400 }
    )
  }

  return proxyToRooms(request, `/rooms/bookings/${encodeURIComponent(bookingId)}`)
}

export async function DELETE(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("bookingId") || request.nextUrl.searchParams.get("id")
  if (bookingId) {
    return proxyToRooms(request, `/rooms/bookings/${encodeURIComponent(bookingId)}`)
  }
  return proxyToRooms(request, "/rooms/bookings")
}
