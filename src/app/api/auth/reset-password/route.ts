import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = body

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, and password confirmation are required" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Forward request to backend
    if (BACKEND_URL) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await backendResponse.json().catch(() => ({}))

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to reset password" },
          { status: backendResponse.status }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
