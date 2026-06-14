"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowUp, Paperclip, Mic, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatComposer({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = React.useState("")
  const [focused, setFocused] = React.useState(false)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }

  return (
    <div className="pointer-events-none sticky bottom-0 z-20 flex justify-center px-4 pb-6">
      <motion.div
        initial={ { y: 40, opacity: 0 } }
        animate={ { y: 0, opacity: 1 } }
        transition={ { type: "spring", stiffness: 240, damping: 26 } }
        className={cn(
          "pointer-events-auto w-full max-w-3xl rounded-3xl border p-2 backdrop-blur-2xl transition-all duration-300",
          focused
            ? "border-primary/40 bg-white/[0.07] shadow-glow"
            : "border-white/10 bg-white/[0.04] shadow-glass",
        )}
      >
        <div className="flex items-end gap-2">
          <button className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
            <Paperclip className="size-5" />
          </button>
          <textarea
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask Justice AI anything…"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <button className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
            <Mic className="size-5" />
          </button>
          <motion.button
            whileTap={ { scale: 0.92 } }
            onClick={submit}
            disabled={!value.trim() || disabled}
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </motion.button>
        </div>
        <div className="flex items-center gap-2 px-2 pb-1 pt-1.5">
          <Sparkles className="size-3 text-accent" />
          <span className="text-[11px] text-muted-foreground">
            Justice AI grounds every answer with verifiable sources.
          </span>
        </div>
      </motion.div>
    </div>
  )
}
