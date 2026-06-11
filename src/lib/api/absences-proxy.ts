import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// The Absence service may be a separate microservice. Fall back to the shared
// backend URL if a dedicated one is not configured.
const BACKEND_URL =
  process.env.BACKEND_ABSENCES_API_URL ||
  process.env.BACKEND_API_URL ||
  process.env.BACKEND_COURSES_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""

if (process.env.NODE_ENV !== "production") {
  try {
    console.debug(
      "[absences-proxy] USING_BACKEND_URL:",
      BACKEND_URL || "(none - set BACKEND_ABSENCES_API_URL or BACKEND_API_URL)"
    )
  } catch {
    // ignore logging errors
  }
}

/**
 * Proxies a JSON request from the browser to the backend Absence service.
 * Reads the HttpOnly access_token cookie and forwards it as a Bearer token.
 *
 * The browser cannot send the HttpOnly JWT directly to the backend, so all
 * absence-service calls are routed through these Next.js route handlers.
 * No dynamic route segments are used on the client; identifiers are passed
 * via query string or request body and injected into the backend path here.
 */
export async function proxyToAbsences(
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

/**
 * Proxies a multipart/form-data request (justification document upload) to the
 * backend Absence service. Does NOT set Content-Type so fetch preserves the
 * multipart boundary, matching the multer-based upload endpoint in the
 * sequence diagram.
 */
export async function proxyFormToAbsences(
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
