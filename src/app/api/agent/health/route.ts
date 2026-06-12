import { NextResponse } from "next/server"
import { AGENT_BACKEND_URL } from "@/lib/api/agent-proxy"

// Agent health probe (Ollama reachability + model availability).
// GET /api/agent/health -> backend GET {BACKEND}/agent/health
// Public on the backend, so no JWT is forwarded.
export async function GET() {
  if (!AGENT_BACKEND_URL) {
    return NextResponse.json({ message: "Backend API URL is not configured" }, { status: 500 })
  }
  try {
    const backendResponse = await fetch(`${AGENT_BACKEND_URL}/agent/health`, {
      cache: "no-store",
    })
    const data = await backendResponse.json().catch(() => ({}))
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Agent service unreachable" },
      { status: 502 }
    )
  }
}
