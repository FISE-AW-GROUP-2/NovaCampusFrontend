import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// GET    /api/courses/enrollments -> backend GET    {BACKEND_API_URL}/courses/enrollments
// PATCH  /api/courses/enrollments -> backend PATCH  {BACKEND_API_URL}/courses/enrollments
// DELETE /api/courses/enrollments -> backend DELETE {BACKEND_API_URL}/courses/enrollments
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/courses/enrollments")
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, "/courses/enrollments")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/courses/enrollments")
}
