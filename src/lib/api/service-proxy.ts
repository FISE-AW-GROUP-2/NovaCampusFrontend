import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Shared proxy factory for the newer microservices (Grades, Payments,
 * Reporting, Notifications). Mirrors the behavior of proxy.ts /
 * absences-proxy.ts: reads the HttpOnly access_token cookie and forwards it
 * as a Bearer token, preserving the incoming query string.
 *
 * The browser cannot send the HttpOnly JWT directly to the backend, so all
 * service calls are routed through Next.js route handlers using these proxies.
 */

export interface ServiceProxy {
  /** Proxies a JSON request and returns the backend's JSON response. */
  proxyJson: (request: NextRequest, backendPath: string) => Promise<NextResponse>
  /**
   * Proxies a request whose response is a binary document (e.g. a generated
   * PDF). Passes the body through untouched and preserves Content-Type /
   * Content-Disposition so the browser can download the file.
   */
  proxyBinary: (request: NextRequest, backendPath: string) => Promise<NextResponse>
}

export function createServiceProxy(serviceName: string, backendUrl: string | undefined): ServiceProxy {
  const BACKEND_URL = backendUrl || process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

  if (process.env.NODE_ENV !== "production") {
    try {
      console.debug(
        `[${serviceName}-proxy] USING_BACKEND_URL:`,
        BACKEND_URL || "(none - set the service URL or BACKEND_API_URL)"
      )
    } catch {
      // ignore logging errors
    }
  }

  const buildRequest = (request: NextRequest) => {
    if (!BACKEND_URL) {
      return {
        error: NextResponse.json(
          { message: "Backend API URL is not configured" },
          { status: 500 }
        ),
      }
    }
    const accessToken = request.cookies.get("access_token")?.value
    if (!accessToken) {
      return {
        error: NextResponse.json({ message: "Not authenticated" }, { status: 401 }),
      }
    }
    return { accessToken }
  }

  const proxyJson = async (request: NextRequest, backendPath: string): Promise<NextResponse> => {
    const prep = buildRequest(request)
    if (prep.error) return prep.error

    const url = `${BACKEND_URL}${backendPath}${request.nextUrl.search}`
    const method = request.method
    const headers: Record<string, string> = {
      Authorization: `Bearer ${prep.accessToken}`,
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

  const proxyBinary = async (request: NextRequest, backendPath: string): Promise<NextResponse> => {
    const prep = buildRequest(request)
    if (prep.error) return prep.error

    const url = `${BACKEND_URL}${backendPath}${request.nextUrl.search}`

    try {
      const backendResponse = await fetch(url, {
        method: request.method,
        headers: { Authorization: `Bearer ${prep.accessToken}` },
      })

      // Errors come back as JSON; forward them so the client can show a message.
      if (!backendResponse.ok) {
        const data = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(data, { status: backendResponse.status })
      }

      const buffer = await backendResponse.arrayBuffer()
      const headers = new Headers()
      headers.set(
        "Content-Type",
        backendResponse.headers.get("content-type") || "application/pdf"
      )
      const disposition = backendResponse.headers.get("content-disposition")
      if (disposition) headers.set("Content-Disposition", disposition)

      return new NextResponse(buffer, { status: backendResponse.status, headers })
    } catch (error) {
      return NextResponse.json(
        {
          message: error instanceof Error ? error.message : "Failed to reach backend",
        },
        { status: 502 }
      )
    }
  }

  return { proxyJson, proxyBinary }
}
