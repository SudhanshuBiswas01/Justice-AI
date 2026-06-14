"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Scale, Sparkles } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { ChatBubble, type ChatMessage } from "@/components/chat/chat-bubble"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { StreamingText } from "@/components/chat/streaming-text"
import { ChatComposer } from "@/components/chat/chat-composer"
import type { Citation } from "@/components/shared/citation-chip"

const suggestions = [
  "Summarize the key clauses in a rental agreement",
  "What are the grounds for anticipatory bail?",
  "Draft a legal notice for unpaid invoices",
  "Explain Section 138 of the NI Act",
]

const sampleCitations: Citation[] = [
  {
    index: 1,
    title: "Transfer of Property Act, 1882",
    source: "Section 106 · Bare Act",
    snippet: "Duration of certain leases in absence of written contract…",
  },
  {
    index: 2,
    title: "Ramesh v. State of Maharashtra",
    source: "2019 SCC OnLine · Precedent",
    snippet: "Notice period clauses held enforceable when reasonable…",
  },
]

const answerText =
  "In most jurisdictions a fixed notice period is enforceable provided it is clearly written, mutually agreed and reasonable in length. For residential leases, statutory defaults may override unusually long periods. I'd recommend confirming the exact clause wording and whether any local rent-control rules apply."

export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [thinking, setThinking] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, thinking])

  function send(value: string) {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    }
    setMessages((m) => [...m, userMsg])
    setThinking(true)

    setTimeout(() => {
      setThinking(false)
      const id = `a-${Date.now()}`
      setMessages((m) => [
        ...m,
        {
          id,
          role: "assistant",
          content: <StreamingText text={answerText} />,
          citations: sampleCitations,
        },
      ])
    }, 1600)
  }

  const empty = messages.length === 0

  return (
    <AppShell title="Chat" showSearch={false}>
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
          <div className="mx-auto max-w-3xl py-8">
            {empty ? (
              <motion.div
                initial={ { opacity: 0, y: 20 } }
                animate={ { opacity: 1, y: 0 } }
                transition={ { duration: 0.6 } }
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
                  Ask anything — Justice AI reasons across statutes, precedent and
                  your documents, then cites its sources.
                </p>

                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={ { opacity: 0, y: 16 } }
                      animate={ { opacity: 1, y: 0 } }
                      transition={ { delay: 0.1 + i * 0.08 } }
                      whileHover={ { y: -3 } }
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
                {messages.map((m) => (
                  <ChatBubble key={m.id} message={m} />
                ))}
                {thinking && (
                  <motion.div
                    initial={ { opacity: 0, y: 10 } }
                    animate={ { opacity: 1, y: 0 } }
                    className="flex gap-3"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow">
                      <Scale className="size-4 text-white" />
                    </div>
                    <TypingIndicator />
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
