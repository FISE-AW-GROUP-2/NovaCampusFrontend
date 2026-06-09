import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyCoursesToBackend } from "@/lib/api/courses-proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// GET    /api/courses/enrollments -> backend GET    {BACKEND_API_URL}/courses/enrollments
// PATCH  /api/courses/enrollments -> backend PATCH  {BACKEND_API_URL}/courses/enrollments
// DELETE /api/courses/enrollments -> backend DELETE {BACKEND_API_URL}/courses/enrollments
export async function GET(request: NextRequest) {
  // Require courseId as a query parameter
  const courseId = request.nextUrl.searchParams.get("courseId")
  if (!courseId) {
    return NextResponse.json({ error: "courseId query parameter is required" }, { status: 400 })
  }

  // Basic validation: a JWT contains dots (.) between segments. Reject values
  // that look like tokens to avoid accidentally forwarding the user's JWT
  // as the courseId to the backend.
  if (courseId.includes(".")) {
    return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
  }

  // Forward to backend ensuring courseId is present in the backend URL.
  return proxyCoursesToBackend(request, `/courses/enrollments?courseId=${encodeURIComponent(courseId)}`)
}

export async function PATCH(request: NextRequest) {
  return proxyCoursesToBackend(request, "/courses/enrollments")
}

export async function DELETE(request: NextRequest) {
  return proxyCoursesToBackend(request, "/courses/enrollments")
}
