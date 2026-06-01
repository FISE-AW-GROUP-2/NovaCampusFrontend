import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ""

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Forward request to backend
    if (BACKEND_URL) {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await backendResponse.json().catch(() => ({}))

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: data.message || "Failed to send reset email" },
          { status: backendResponse.status }
        )
      }
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
