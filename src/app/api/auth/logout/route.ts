import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Default to local backend API if not provided
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (refreshToken && BACKEND_URL) {
      // Notify backend to invalidate the refresh token
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
      }).catch(() => {
        // Ignore backend errors - still clear local cookies
      })
    }

    // Clear all auth cookies
    const response = NextResponse.json({ success: true })

    response.cookies.delete("access_token")
    response.cookies.delete("refresh_token")
    response.cookies.delete("user_data")

    return response
  } catch (error) {
    console.error("Logout error:", error)

    // Still try to clear cookies even on error
    const response = NextResponse.json({ success: true })
    response.cookies.delete("access_token")
    response.cookies.delete("refresh_token")
    response.cookies.delete("user_data")

    return response
  }
}
