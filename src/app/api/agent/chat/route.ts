import type { NextRequest } from "next/server"
import { proxyToAgent } from "@/lib/api/agent-proxy"

// AI assistant chat (any authenticated user).
// POST /api/agent/chat -> backend POST {BACKEND}/agent/chat
//   body { message, history } — the agent is stateless, the frontend sends
//   the conversation history with each request.
export async function POST(request: NextRequest) {
  return proxyToAgent(request, "/agent/chat")
}
