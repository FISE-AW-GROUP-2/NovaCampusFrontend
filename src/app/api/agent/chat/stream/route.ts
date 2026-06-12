import type { NextRequest } from "next/server"
import { proxyStreamToAgent } from "@/lib/api/agent-proxy"

// Streaming AI assistant chat (any authenticated user).
// POST /api/agent/chat/stream -> backend POST {BACKEND}/agent/chat/stream
//   The Ollama token stream is piped through unbuffered.
export async function POST(request: NextRequest) {
  return proxyStreamToAgent(request, "/agent/chat/stream")
}
