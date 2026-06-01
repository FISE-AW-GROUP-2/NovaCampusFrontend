import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Forward request to backend
    if (BACKEND_URL) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/sessions/${sessionId}`, {
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
