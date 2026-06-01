import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Forward request to backend
    if (BACKEND_URL) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/sessions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!backendResponse.ok) {
        const data = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(
          { error: data.message || "Failed to fetch sessions" },
          { status: backendResponse.status }
        )
      }

      const data = await backendResponse.json()
      return NextResponse.json({ sessions: data.sessions || data })
    }

    // Return empty sessions if no backend
    return NextResponse.json({ sessions: [] })
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
