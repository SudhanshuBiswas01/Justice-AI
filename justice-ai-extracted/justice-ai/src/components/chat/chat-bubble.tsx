"use client"

import { motion } from "framer-motion"
import { Scale, User } from "lucide-react"
import { CitationChip, type Citation } from "@/components/shared/citation-chip"
import { SourceBadge } from "@/components/shared/source-badge"
import { cn } from "@/lib/utils"

export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  id: string
  role: ChatRole
  content: React.ReactNode
  citations?: Citation[]
}

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={ { opacity: 0, y: 14 } }
      animate={ { opacity: 1, y: 0 } }
      transition={ { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
      className={cn("flex w-full gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          isUser
            ? "border border-white/10 bg-white/[0.04]"
            : "bg-brand-gradient shadow-glow",
        )}
      >
        {isUser ? (
          <User className="size-4 text-foreground" />
        ) : (
          <Scale className="size-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm border border-white/10 bg-white/[0.06] text-foreground"
            : "rounded-tl-sm border border-white/10 bg-white/[0.03] text-foreground/90",
        )}
      >
        <div className="space-y-2">{message.content}</div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-t border-white/5 pt-3">
            <SourceBadge count={message.citations.length} />
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c) => (
                <CitationChip key={c.index} citation={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
