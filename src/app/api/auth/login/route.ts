import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

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
    const body = await request.json()
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Forward login request to backend
    const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, rememberMe }),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.message || "Invalid credentials" },
        { status: backendResponse.status }
      )
    }

    // Calculate max age based on rememberMe option
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 // 30 days
      : 24 * 60 * 60 // 1 day

    // Fetch full user profile from backend using the new access token
    const meResponse = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    })
    const rawUser = meResponse.ok ? await meResponse.json() : jose.decodeJwt(data.accessToken)

    // Use the user object as-is from the backend
    const user = rawUser

    // Create response with user data
    const response = NextResponse.json({ user })

    // Set HttpOnly cookies for tokens
    response.cookies.set("access_token", data.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60, // Access token: 15 minutes
    })

    response.cookies.set("refresh_token", data.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge, // Refresh token: based on rememberMe
    })

    // Store user data in a non-httpOnly cookie for client access
    response.cookies.set("user_data", JSON.stringify(user), {
      ...COOKIE_OPTIONS,
      httpOnly: false,
      maxAge,
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
