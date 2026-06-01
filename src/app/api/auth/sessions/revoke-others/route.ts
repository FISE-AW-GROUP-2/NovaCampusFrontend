import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

export async function POST(request: NextRequest) {
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
      const backendResponse = await fetch(`${BACKEND_URL}/auth/sessions/revoke-others`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!backendResponse.ok) {
        const data = await backendResponse.json().catch(() => ({}))
        return NextResponse.json(
          { error: data.message || "Failed to revoke sessions" },
          { status: backendResponse.status }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Revoke other sessions error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
