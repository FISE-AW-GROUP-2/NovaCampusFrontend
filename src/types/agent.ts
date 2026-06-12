// AI Agent Service Types (Ollama-backed assistant)

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface AgentHealth {
  ok: boolean
  /** Name of the Ollama model when reported by the backend. */
  model?: string
  message?: string
}
