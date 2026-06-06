import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// POST /api/courses/enroll -> backend POST /api/courses/enroll
export async function POST(request: NextRequest) {
  return proxyToBackend(request, "/api/courses/enroll")
}
