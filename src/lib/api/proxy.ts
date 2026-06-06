import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BACKEND_URL = process.env.BACKEND_COURSES_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Proxies a JSON request from the browser to the backend course service.
 * Reads the HttpOnly access_token cookie and forwards it as a Bearer token.
 *
 * The browser cannot send the HttpOnly JWT directly to the backend, so all
 * course-service calls are routed through these Next.js route handlers.
 */
export async function proxyToBackend(
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

    // Pass through 204 No Content
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

/**
 * Proxies a multipart/form-data request (file upload) to the backend.
 * Does NOT set Content-Type so the boundary is preserved by fetch.
 */
export async function proxyFormToBackend(
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

  const incomingQuery = request.nextUrl.search
  const url = `${BACKEND_URL}${backendPath}${incomingQuery}`

  try {
    const formData = await request.formData()
    const backendResponse = await fetch(url, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

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
