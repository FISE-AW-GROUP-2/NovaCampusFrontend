import type { NextRequest } from "next/server"
import { proxyToBackend, proxyFormToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// GET    /api/courses/resources -> backend GET    {BACKEND_API_URL}/courses/resources
// POST   /api/courses/resources -> backend POST   {BACKEND_API_URL}/courses/resources (multipart upload)
// DELETE /api/courses/resources -> backend DELETE {BACKEND_API_URL}/courses/resources
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/courses/resources")
}

export async function POST(request: NextRequest) {
  return proxyFormToBackend(request, "/courses/resources")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/courses/resources")
}
