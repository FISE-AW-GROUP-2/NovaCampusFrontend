import { createServiceProxy } from "./service-proxy"

// AI Agent microservice (default port 3010, mounted at /api/agent).
// Stateless: the frontend sends the conversation history with each message.
const { proxyJson, proxyStream } = createServiceProxy(
  "agent",
  process.env.BACKEND_AGENT_API_URL
)

export { proxyJson as proxyToAgent, proxyStream as proxyStreamToAgent }

// The /health probe is public on the backend (no JWT), so it bypasses the
// authenticated proxy helpers above.
export const AGENT_BACKEND_URL =
  process.env.BACKEND_AGENT_API_URL ||
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
