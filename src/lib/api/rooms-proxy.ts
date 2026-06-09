import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// The Room service may be a separate microservice. Fall back to the shared
// backend URL if a dedicated one is not configured.
const BACKEND_URL =
  process.env.BACKEND_ROOMS_API_URL ||
  process.env.BACKEND_COURSES_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""

/**
 * Proxies a JSON request from the browser to the backend Room service.
 * Reads the HttpOnly access_token cookie and forwards it as a Bearer token.
 *
 * The browser cannot send the HttpOnly JWT directly to the backend, so all
 * room-service calls are routed through these Next.js route handlers.
 */
export async function proxyToRooms(
  request: NextRequest,
  backendPath: string
): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "Backend API URL is not configured" },
      { status: 500 }
    )
  }

  const accessToken = request.cookies.get("access_token")?.value
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  // Preserve incoming query string when forwarding to the backend
  const incomingQuery = request.nextUrl.search
  const url = `${BACKEND_URL}${backendPath}${incomingQuery}`

  const method = request.method
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  }

  let body: string | undefined
  if (method !== "GET" && method !== "DELETE") {
    const text = await request.text()
    if (text) {
      body = text
      headers["Content-Type"] = "application/json"
    }
  }

  try {
    const backendResponse = await fetch(url, { method, headers, body })

    if (backendResponse.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await backendResponse.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to reach backend",
      },
      { status: 502 }
    )
  }
}
