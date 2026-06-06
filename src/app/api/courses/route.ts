import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes the "/api" segment, so the backend path here
// must NOT repeat it (otherwise the URL becomes /api/api/courses).
// GET    /api/courses -> backend GET    {BACKEND_API_URL}/courses
// POST   /api/courses -> backend POST   {BACKEND_API_URL}/courses
// PUT    /api/courses -> backend PUT    {BACKEND_API_URL}/courses
// DELETE /api/courses -> backend DELETE {BACKEND_API_URL}/courses
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/courses")
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/courses")
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, "/courses")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/courses")
}
