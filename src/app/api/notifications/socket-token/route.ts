import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// The Socket.io server of the Notification service authenticates the
// handshake with the JWT (io({ auth: { token } })). Because the access token
// is stored in an HttpOnly cookie, the browser cannot read it directly; this
// same-origin route hands the token to the client only for the socket
// handshake.
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }
  return NextResponse.json({ token: accessToken })
}
