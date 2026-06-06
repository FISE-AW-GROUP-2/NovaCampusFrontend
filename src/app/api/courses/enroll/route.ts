import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// POST /api/courses/enroll -> backend POST {BACKEND_API_URL}/courses/enroll
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/courses/enroll")
}
