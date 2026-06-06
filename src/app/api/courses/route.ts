import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// GET    /api/courses        -> backend GET    /api/courses
// POST   /api/courses        -> backend POST   /api/courses
// PUT    /api/courses        -> backend PUT    /api/courses
// DELETE /api/courses        -> backend DELETE /api/courses
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/courses")
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/courses")
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, "/api/courses")
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, "/api/courses")
}
