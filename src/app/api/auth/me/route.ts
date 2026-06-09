import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

// Default to local backend API if not provided
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value
    const userDataCookie = request.cookies.get("user_data")?.value

    // If we have a valid user_data cookie, use that first (faster)
    if (userDataCookie) {
      try {
        const user = JSON.parse(userDataCookie)
        return NextResponse.json({ user })
      } catch {
        // Invalid JSON, fall through to token verification
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // If backend URL is available, verify with backend
    if (BACKEND_URL) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }

      const data = await backendResponse.json()
      return NextResponse.json({ user: data.user || data })
    }

    // Fallback: decode token locally (without verification for development)
    try {
      const decoded = jose.decodeJwt(accessToken)
      const user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        avatar: decoded.avatar,
        campusId: decoded.campusId,
      }
      return NextResponse.json({ user })
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
