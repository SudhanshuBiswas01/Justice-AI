"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Scale, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AppShell } from "@/components/shared/app-shell"
import { ChatBubble, type ChatMessage } from "@/components/chat/chat-bubble"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { ChatComposer } from "@/components/chat/chat-composer"
import { SourceBadge } from "@/components/shared/source-badge"
import { CitationChip, type Citation } from "@/components/shared/citation-chip"

const suggestions = [
  "I got a traffic challan — is it valid?",
  "Retailer charged above MRP. What can I do?",
  "My refund is stuck for 3 weeks. Help!",
  "How do I file a consumer court complaint?",
]

// Internal message type (extends ChatMessage with source metadata)
interface LiveMessage extends ChatMessage {
  source_type?: "corpus" | "web_fallback" | "greeting"
  citations?: Citation[]
}

export default function ChatPage() {
  const [messages, setMessages] = React.useState<LiveMessage[]>([])
  const [thinking, setThinking] = React.useState(false)
  const [latency, setLatency] = React.useState<number | null>(null)
  const [startTime, setStartTime] = React.useState<number>(0)
  const [elapsed, setElapsed] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, thinking])

  // Live elapsed timer
  React.useEffect(() => {
    if (thinking) {
      const t = Date.now()
      setStartTime(t)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((Date.now() - t) / 1000), 100)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [thinking])

  async function send(value: string) {
    const userMsg: LiveMessage = { id: `u-${Date.now()}`, role: "user", content: value }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setThinking(true)
    setLatency(null)
    const t0 = Date.now()

    try {
      // Build messages in the format the backend expects
      const backendMessages = newMessages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : value,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: backendMessages }),
      })

      const finalLatency = (Date.now() - t0) / 1000
      setLatency(finalLatency)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || `Server error ${response.status}`)
      }

      const data = await response.json()
      // data = { response, source_type, citations }

      // Map backend citations to our CitationChip format
      const citations: Citation[] = (data.citations || []).map((c: any) => ({
        index: c.ref,
        title: c.title || c.act_name || "Legal Reference",
        source: [c.act_name, c.section ? `§ ${c.section}` : ""].filter(Boolean).join(" · "),
        snippet: "",
      }))

      const assistantMsg: LiveMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: (
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-sm max-w-none">
            {data.response}
          </ReactMarkdown>
        ),
        source_type: data.source_type ?? "corpus",
        citations,
      }
      setMessages((m) => [...m, assistantMsg])
    } catch (err: any) {
      const errorMsg: LiveMessage = {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: `Sorry, something went wrong: ${err.message}`,
        source_type: "web_fallback",
      }
      setMessages((m) => [...m, errorMsg])
    } finally {
      setThinking(false)
    }
  }

  const empty = messages.length === 0

  return (
    <AppShell title="Chat" showSearch={false}>
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
          <div className="mx-auto max-w-3xl py-8">
            {empty ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center pt-10 text-center"
              >
                <div className="relative mb-6 grid size-16 place-items-center rounded-2xl bg-brand-gradient shadow-glow">
                  <Scale className="size-8 text-white" />
                  <div className="absolute inset-0 rounded-2xl bg-brand-gradient blur-xl opacity-50 -z-10" />
                </div>
                <h2 className="font-display text-3xl font-semibold">
                  How can I help with your case?
                </h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Ask anything — Justice AI reasons across Indian statutes, consumer law and
                  traffic regulations, then cites its sources.
                </p>

                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      whileHover={{ y: -3 }}
                      onClick={() => send(s)}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <Sparkles className="size-4 shrink-0 text-accent" />
                      <span className="text-foreground/90">{s}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, idx) => (
                  <div key={m.id}>
                    <ChatBubble message={m} />
                    {/* Source badge + citations under assistant messages */}
                    {m.role === "assistant" && m.source_type && m.source_type !== "greeting" && (
                      <div className="ml-12 mt-2 flex flex-col gap-2">
                        {m.source_type === "web_fallback" ? (
                          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                            ⚠️ General knowledge — verify independently
                          </span>
                        ) : (
                          <SourceBadge count={m.citations?.length ?? 0} />
                        )}
                        {m.citations && m.citations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {m.citations.map((c) => (
                              <CitationChip key={c.index} citation={c} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Latency badge on last message */}
                    {!thinking && latency !== null && idx === messages.length - 1 && m.role === "assistant" && (
                      <div className="ml-12 mt-1 text-[11px] text-muted-foreground font-mono">
                        ⏱ {latency.toFixed(1)}s
                      </div>
                    )}
                  </div>
                ))}
                {thinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow">
                      <Scale className="size-4 text-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <TypingIndicator />
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {elapsed.toFixed(1)}s — searching legal corpus…
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        <ChatComposer onSend={send} disabled={thinking} />
      </div>
    </AppShell>
  )
}
