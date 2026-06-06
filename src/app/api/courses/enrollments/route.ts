import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// GET    /api/courses/enrollments -> backend GET    /api/courses/enrollments
// PATCH  /api/courses/enrollments -> backend PATCH  /api/courses/enrollments
// DELETE /api/courses/enrollments -> backend DELETE /api/courses/enrollments
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/enrollments")
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/enrollments")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/enrollments")
}
