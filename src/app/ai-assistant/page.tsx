"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Bot, Send, Sparkles, TrendingUp, Target, MessageSquare } from "lucide-react"
import { useState } from "react"

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI marketing assistant. I can help you with campaign strategies, content ideas, audience insights, and performance optimization. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")

  const suggestions = [
    { icon: TrendingUp, text: "Analyze my campaign performance", color: "text-blue-500" },
    { icon: Target, text: "Suggest target audience", color: "text-purple-500" },
    { icon: Sparkles, text: "Generate campaign ideas", color: "text-pink-500" },
    { icon: MessageSquare, text: "Write ad copy", color: "text-green-500" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-64">
        <Header
          title="AI Assistant"
          description="Get intelligent insights and recommendations for your marketing campaigns."
          actions={
            <>
              <Button className="w-full sm:w-auto h-9 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                <Sparkles className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </>
          }
        />

        <div className="mt-4 md:mt-5 space-y-3 md:space-y-4">
          <Card className="bg-card border-border overflow-hidden">
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                    {suggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-card/50 backdrop-blur border-border"
                      >
                        <div className="flex items-center gap-3">
                          <suggestion.icon className={`w-5 h-5 ${suggestion.color}`} />
                          <p className="text-sm font-medium text-foreground">{suggestion.text}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-card/50 backdrop-blur">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about your campaigns..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-background border-border"
                  />
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
