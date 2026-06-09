import type { NextRequest } from "next/server"
import { proxyCoursesToBackend } from "@/lib/api/courses-proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// POST /api/courses/enroll -> backend POST {BACKEND_API_URL}/courses/enroll
export async function POST(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId")
  if (!courseId) {
    return new Response(JSON.stringify({ error: "courseId query parameter is required" }), { status: 400 })
  }
  return proxyCoursesToBackend(request, `/courses/enroll/${encodeURIComponent(courseId)}`)
}
