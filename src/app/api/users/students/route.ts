import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// BACKEND_API_URL already includes "/api", so do not repeat it here.
// GET /api/users/students -> backend GET {BACKEND_API_URL}/users/students
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/users/students")
}
