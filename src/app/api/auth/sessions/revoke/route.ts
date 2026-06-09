import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Default to local backend API if not provided
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required in the request body" },
        { status: 400 }
      )
    }

    // Forward request to backend (DELETE /auth/sessions/:sessionId)
    const backendResponse = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!backendResponse.ok) {
      const data = await backendResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.message || "Failed to revoke session" },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revoke session error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
