import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

// GET /api/users/students -> backend GET /api/users/students
export async function GET(request: NextRequest) {
  return proxyToBackend(request, "/api/users/students")
}
