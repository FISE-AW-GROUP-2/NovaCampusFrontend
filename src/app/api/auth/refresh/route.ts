import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Default to local backend API if not provided
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      )
    }

    // Forward refresh request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    if (!backendResponse.ok) {
      const errorResponse = NextResponse.json(
        { error: "Token refresh failed" },
        { status: backendResponse.status }
      )
      // Only clear cookies if the token is explicitly rejected (not on server errors)
      if (backendResponse.status === 401 || backendResponse.status === 403) {
        errorResponse.cookies.delete("access_token")
        errorResponse.cookies.delete("refresh_token")
        errorResponse.cookies.delete("user_data")
      }
      return errorResponse
    }

    const data = await backendResponse.json()

    // Create response
    const response = NextResponse.json({
      success: true,
      expiresAt: data.expiresAt,
    })

    // Update access token cookie
    response.cookies.set("access_token", data.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60, // 15 minutes
    })

    // If backend rotates refresh token, update it
    if (data.refreshToken) {
      // Preserve the original maxAge (check if user_data exists to determine)
      const userData = request.cookies.get("user_data")
      const maxAge = userData ? 30 * 24 * 60 * 60 : 24 * 60 * 60

      response.cookies.set("refresh_token", data.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge,
      })
    }

    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: "An error occurred during token refresh" },
      { status: 500 }
    )
  }
}
