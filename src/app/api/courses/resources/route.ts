import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { proxyToBackend, proxyFormToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// GET    /api/courses/resources -> backend GET    {BACKEND_API_URL}/courses/resources
// POST   /api/courses/resources -> backend POST   {BACKEND_API_URL}/courses/resources (multipart upload)
// DELETE /api/courses/resources -> backend DELETE {BACKEND_API_URL}/courses/resources
export async function GET(request: NextRequest) {
  // Require courseId as a query parameter
  const courseId = request.nextUrl.searchParams.get("courseId")
  if (!courseId) {
    return NextResponse.json({ error: "courseId query parameter is required" }, { status: 400 })
  }

  // If courseId is present in the incoming URL, proxyToBackend will preserve it.
  // However, include it explicitly when forwarding to ensure backend receives it.
  return proxyToBackend(request, `/courses/resources?courseId=${encodeURIComponent(courseId)}`)
}

export async function POST(request: NextRequest) {
  // Prefer courseId from query string
  const urlCourseId = request.nextUrl.searchParams.get("courseId")
  if (urlCourseId) {
    return proxyFormToBackend(request, "/courses/resources")
  }

  // If not present in query, try to read it from multipart form data (e.g. when uploading files)
  try {
    const cloned = request.clone()
    const formData = await cloned.formData()
    const fdCourseId = formData.get("courseId")
    if (!fdCourseId) {
      return NextResponse.json({ error: "courseId query parameter is required" }, { status: 400 })
    }

    const courseId = String(fdCourseId)
    // Forward original request but include courseId in backend path so backend receives it as a query param
    return proxyFormToBackend(request, `/courses/resources?courseId=${encodeURIComponent(courseId)}`)
  } catch (err) {
    return NextResponse.json({ error: "Failed to read form data" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/courses/resources")
}
