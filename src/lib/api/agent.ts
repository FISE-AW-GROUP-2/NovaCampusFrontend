/**
 * AI Agent Service API Client (Ollama-backed assistant)
 *
 * All calls go through same-origin Next.js proxy routes which forward the
 * HttpOnly JWT to the backend agent microservice (mounted at /api/agent).
 * The agent is stateless: the conversation history is sent with each message.
 *
 * Backend endpoints:
 *  - GET  /agent/health       (public) Ollama reachability + model availability
 *  - POST /agent/chat         (auth)   body { message, history }
 *  - POST /agent/chat/stream  (auth)   token-by-token streaming response
 */

import { apiClient } from "./client"
import type { AgentHealth, ChatMessage } from "@/types/agent"

const AGENT_BASE = "/api/agent"

export interface AgentApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  status?: number
}

// ---- Health ---------------------------------------------------------------

export async function getAgentHealthApi(): Promise<AgentApiResult<AgentHealth>> {
  try {
    const response = await fetch(`${AGENT_BASE}/health`, { cache: "no-store" })
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const ok =
      response.ok &&
      (data.ok === true ||
        data.status === "ok" ||
        data.healthy === true ||
        // Treat a 200 without an explicit flag as healthy.
        (data.ok === undefined && data.status === undefined && data.healthy === undefined))
    return {
      success: response.ok,
      data: {
        ok,
        model: (data.model as string) || (data.modelName as string) || undefined,
        message: (data.message as string) || (data.error as string) || undefined,
      },
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: { ok: false },
      error: error instanceof Error ? error.message : "Agent service unreachable",
    }
  }
}

// ---- Reasoning-model output -------------------------------------------------
// Reasoning models served by Ollama (deepseek-r1, qwen3...) prepend their
// chain of thought wrapped in <think>...</think>. Hide it and only surface
// the final answer.

function stripThinking(text: string): string {
  // Drop completed think blocks.
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, "")
  // Drop an unclosed block (the model is still thinking mid-stream).
  const open = out.search(/<think>/i)
  if (open !== -1) out = out.slice(0, open)
  // Drop stray tags (e.g. a stream that started inside a block).
  out = out.replace(/<\/?think>/gi, "")
  return out.replace(/^\s+/, "")
}

// ---- Chat -------------------------------------------------------------------

// Pulls the assistant text out of whatever shape the controller returns
// ({ reply } / { response } / { message: { content } } / bare string...).
function extractReply(data: unknown): string {
  if (typeof data === "string") return data
  const obj = (data ?? {}) as Record<string, unknown>
  for (const key of ["reply", "response", "answer", "content", "text", "output"]) {
    if (typeof obj[key] === "string") return obj[key] as string
  }
  const message = obj.message as Record<string, unknown> | string | undefined
  if (typeof message === "string") return message
  if (message && typeof message.content === "string") return message.content
  return ""
}

export async function chatApi(
  message: string,
  history: ChatMessage[]
): Promise<AgentApiResult<string>> {
  const response = await apiClient.post<unknown>(`${AGENT_BASE}/chat`, { message, history })
  const reply = response.error ? undefined : stripThinking(extractReply(response.data))
  return {
    success: !response.error && !!reply,
    data: reply,
    error: response.error?.message || (reply ? undefined : "The assistant returned no reply"),
    status: response.error?.status,
  }
}

// ---- Streaming chat ---------------------------------------------------------

// Extracts the token text from one parsed stream event. Supports the Ollama
// chat shape ({ message: { content }, done }) and common SSE payloads.
function extractToken(payload: unknown): string {
  if (typeof payload === "string") return payload
  const obj = (payload ?? {}) as Record<string, unknown>
  const message = obj.message as Record<string, unknown> | undefined
  if (message && typeof message.content === "string") return message.content
  for (const key of ["content", "token", "delta", "response", "text", "reply"]) {
    if (typeof obj[key] === "string") return obj[key] as string
  }
  return ""
}

/**
 * Streams the assistant's reply. Because <think> blocks can be split across
 * chunks, the callback receives the full *visible* text so far (with the
 * reasoning stripped) rather than raw token deltas. Tolerates three wire
 * formats: SSE ("data: {...}" lines), NDJSON (one JSON object per line —
 * Ollama's native stream), and plain text chunks.
 */
export async function chatStreamApi(
  message: string,
  history: ChatMessage[],
  onUpdate: (visibleText: string) => void
): Promise<AgentApiResult<string>> {
  try {
    const response = await fetch(`${AGENT_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, history }),
    })

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        error:
          (data as Record<string, string>).message ||
          (data as Record<string, string>).error ||
          `Stream failed with status ${response.status}`,
        status: response.status,
      }
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let full = ""
    let sawStructuredLine = false

    // Re-derive the visible text from the full raw transcript each time so a
    // <think> tag split across chunks is still stripped correctly.
    const emit = () => onUpdate(stripThinking(full))

    const handleLine = (rawLine: string) => {
      let line = rawLine.trim()
      if (!line) return
      if (line.startsWith("data:")) line = line.slice(5).trim()
      if (line === "[DONE]") return
      try {
        const parsed = JSON.parse(line)
        sawStructuredLine = true
        const token = extractToken(parsed)
        if (token) {
          full += token
          emit()
        }
      } catch {
        // Not JSON — treat the line as raw text (plain-text streams).
        if (!sawStructuredLine) {
          full += rawLine
          emit()
        }
      }
    }

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split("\n")
      // Keep the last partial line in the buffer until more data arrives.
      buffer = lines.pop() ?? ""
      for (const line of lines) handleLine(line)
    }
    if (buffer) handleLine(buffer)

    const visible = stripThinking(full)
    // Success requires visible output: a reply that was pure <think> content
    // (or empty) falls back to the non-streaming endpoint in the UI.
    return { success: visible.length > 0, data: visible, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
