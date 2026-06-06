import type { NextRequest } from "next/server"
import { proxyToBackend, proxyFormToBackend } from "@/lib/api/proxy"

// GET    /api/courses/resources -> backend GET    /api/courses/resources
// POST   /api/courses/resources -> backend POST   /api/courses/resources (multipart upload)
// DELETE /api/courses/resources -> backend DELETE /api/courses/resources
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/resources")
}

export async function POST(request: NextRequest) {
  return proxyFormToBackend(request, "/api/courses/resources")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/resources")
}
