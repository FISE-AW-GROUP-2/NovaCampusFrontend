import type { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/api/proxy"

interface RouteParams {
  params: Promise<{ usersession: string }>
}

// GET /api/users/[usersession] -> backend GET {BACKEND_API_URL}/users/:usersession
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { usersession } = await params

  // Forward to backend path containing the usersession. proxyToBackend will preserve any query string.
  return proxyToBackend(request, `/users/${encodeURIComponent(usersession)}`)
}
