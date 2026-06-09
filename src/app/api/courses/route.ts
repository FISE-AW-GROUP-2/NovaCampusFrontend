import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyCoursesToBackend } from "@/lib/api/courses-proxy"

// BACKEND_API_URL already includes the "/api" segment, so the backend path here
// must NOT repeat it (otherwise the URL becomes /api/api/courses).
// GET    /api/courses -> backend GET    {BACKEND_API_URL}/courses
// POST   /api/courses -> backend POST   {BACKEND_API_URL}/courses
// PUT    /api/courses/{courseId} -> backend PUT    {BACKEND_API_URL}/courses/{courseId}
// DELETE /api/courses -> backend DELETE {BACKEND_API_URL}/courses
export async function GET(request: NextRequest) {
  return proxyCoursesToBackend(request, "/courses")
}

export async function POST(request: NextRequest) {
  return proxyCoursesToBackend(request, "/courses")
}

export async function PUT(request: NextRequest) {
  // Accept courseId from query parameter or JSON body (for non-dynamic route usage)
  let courseId = request.nextUrl.searchParams.get("courseId")

  if (!courseId) {
    try {
      const cloned = request.clone()
      const text = await cloned.text()
      if (text) {
        try {
          const body = JSON.parse(text)
          courseId = body.courseId || body.id || body._id
        } catch (e) {
          // ignore JSON parse errors
        }
      }
    } catch (e) {
      // ignore read errors
    }
  }

  if (!courseId) {
    return NextResponse.json({ error: "courseId query parameter or body id is required" }, { status: 400 })
  }

  // Forward to backend with courseId in the path. Original request body is forwarded by proxyCoursesToBackend.
  return proxyCoursesToBackend(request, `/courses/${encodeURIComponent(courseId)}`)
}

export async function DELETE(request: NextRequest) {
  // Accept courseId or id query parameter for deletion
  const courseId = request.nextUrl.searchParams.get("courseId") || request.nextUrl.searchParams.get("id")
  if (courseId) {
    return proxyCoursesToBackend(request, `/courses/${encodeURIComponent(courseId)}`)
  }

  return proxyCoursesToBackend(request, "/courses")
}
