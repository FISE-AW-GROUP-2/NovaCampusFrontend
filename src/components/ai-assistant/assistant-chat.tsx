"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/contexts/auth-context"
import { chatApi, chatStreamApi, getAgentHealthApi } from "@/lib/api/agent"
import type { AgentHealth, ChatMessage } from "@/types/agent"
import { cn } from "@/lib/utils"
import {
  Bot,
  Send,
  GraduationCap,
  CalendarX2,
  CreditCard,
  BookOpen,
} from "lucide-react"

const SUGGESTIONS = [
  { icon: GraduationCap, text: "How is my grade average computed?", color: "text-blue-500" },
  { icon: CalendarX2, text: "How do I justify an absence?", color: "text-purple-500" },
  { icon: CreditCard, text: "When is my next tuition payment due?", color: "text-green-500" },
  { icon: BookOpen, text: "Summarize how course enrollment works", color: "text-pink-500" },
]

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm the NovaCampus assistant. Ask me anything about your courses, grades, absences, schedule or payments and I'll do my best to help.",
}

export function AssistantChat() {
  const { user } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [health, setHealth] = useState<AgentHealth | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAgentHealthApi().then((result) => setHealth(result.data ?? { ok: false }))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || isSending) return

      setError(null)
      setIsSending(true)
      setInput("")

      // The agent is stateless — send the prior conversation (without the
      // canned greeting) as history.
      const history = messages.filter((m) => m !== GREETING)
      setMessages((prev) => [...prev, { role: "user", content: message }])

      // Placeholder assistant message that streaming fills in.
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])
      const updateLast = (updater: (content: string) => string) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          next[next.length - 1] = { ...last, content: updater(last.content) }
          return next
        })
      }

      try {
        // The callback receives the full visible reply so far — the client
        // strips <think>...</think> reasoning before it reaches the UI.
        const streamed = await chatStreamApi(message, history, (visibleText) => {
          updateLast(() => visibleText)
        })

        if (!streamed.success) {
          // Fall back to the non-streaming endpoint.
          const result = await chatApi(message, history)
          if (result.success && result.data) {
            updateLast(() => result.data!)
          } else {
            // Drop the empty placeholder and surface the error.
            setMessages((prev) => prev.slice(0, -1))
            setError(
              result.error ||
                streamed.error ||
                "The assistant is unavailable. Check that the agent service and Ollama are running."
            )
          }
        }
      } finally {
        setIsSending(false)
        inputRef.current?.focus()
      }
    },
    [messages, isSending]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const resetChat = () => {
    setMessages([GREETING])
    setError(null)
    setInput("")
  }

  const showSuggestions = messages.length === 1 && !isSending

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {health === null ? (
          <Badge variant="outline" className="text-muted-foreground">
            Checking assistant...
          </Badge>
        ) : health.ok ? (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
            Online{health.model ? ` — ${health.model}` : ""}
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
            Offline{health.message ? ` — ${health.message}` : ""}
          </Badge>
        )}

        <Button variant="outline" size="sm" className="ml-auto h-8" onClick={resetChat}>
          New Chat
        </Button>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="flex flex-col h-[calc(100vh-300px)] min-h-[420px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1
              const waiting =
                isSending && isLast && message.role === "assistant" && !message.content
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {waiting ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="h-4 w-4" />
                        Thinking...
                      </span>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm p-3">
                {error}
              </div>
            )}

            {showSuggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                {SUGGESTIONS.map((suggestion) => (
                  <Card
                    key={suggestion.text}
                    className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-card/50 backdrop-blur border-border"
                    onClick={() => sendMessage(suggestion.text)}
                  >
                    <div className="flex items-center gap-3">
                      <suggestion.icon className={cn("w-5 h-5", suggestion.color)} />
                      <p className="text-sm font-medium text-foreground">{suggestion.text}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card/50 backdrop-blur">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={
                  user?.name
                    ? `Ask me anything, ${user.name.split(" ")[0]}...`
                    : "Ask me anything about the campus..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-background border-border"
              />
              <Button
                type="submit"
                disabled={isSending || !input.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSending ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
