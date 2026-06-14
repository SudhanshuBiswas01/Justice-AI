"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Phone, Pause, Volume2 } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { VoiceOrb, type VoiceState } from "@/components/voice/voice-orb"
import { Waveform } from "@/components/voice/waveform"
import { SourceBadge } from "@/components/shared/source-badge"
import { cn } from "@/lib/utils"

const stateCopy: Record<VoiceState, { label: string; sub: string }> = {
  idle: { label: "Tap to start", sub: "Nyay is ready when you are" },
  listening: { label: "Listening…", sub: "Speak naturally" },
  thinking: { label: "Thinking…", sub: "Reasoning across sources" },
  speaking: { label: "Nyay is speaking", sub: "Grounded in verified law" },
}

const transcript = [
  { role: "user", text: "What should I do if a tenant refuses to vacate?" },
  {
    role: "nyay",
    text: "You can issue a formal eviction notice and, if ignored, file a suit for possession under the Rent Control Act applicable in your state.",
  },
]

export default function VoicePage() {
  const [state, setState] = React.useState<VoiceState>("idle")
  const [active, setActive] = React.useState(false)

  // Demo: cycle through states while a session is active.
  React.useEffect(() => {
    if (!active) {
      setState("idle")
      return
    }
    const seq: VoiceState[] = ["listening", "thinking", "speaking"]
    let i = 0
    setState("listening")
    const id = setInterval(() => {
      i = (i + 1) % seq.length
      setState(seq[i])
    }, 2800)
    return () => clearInterval(id)
  }, [active])

  const copy = stateCopy[state]

  return (
    <AppShell title="Nyay Voice AI" showSearch={false}>
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
        {/* Ambient reactive glow */}
        <motion.div
          className="pointer-events-none absolute size-[36rem] rounded-full bg-primary/20 blur-3xl"
          animate={ {
            scale: state === "speaking" ? [1, 1.2, 1] : state === "listening" ? [1, 1.1, 1] : 1,
            opacity: active ? 0.5 : 0.25,
          } }
          transition={ { duration: 2, repeat: Infinity } }
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <VoiceOrb state={state} />

          <Waveform state={state} className="w-72" />

          <div className="flex flex-col items-center gap-1 text-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={copy.label}
                initial={ { opacity: 0, y: 10 } }
                animate={ { opacity: 1, y: 0 } }
                exit={ { opacity: 0, y: -10 } }
                className="font-display text-2xl font-semibold"
              >
                {copy.label}
              </motion.h2>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground">{copy.sub}</p>
            {state === "speaking" && <SourceBadge count={3} className="mt-2" />}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!active ? (
              <motion.button
                whileHover={ { scale: 1.05 } }
                whileTap={ { scale: 0.95 } }
                onClick={() => setActive(true)}
                className="flex h-16 items-center gap-3 rounded-full bg-brand-gradient px-8 text-base font-medium text-white shadow-glow"
              >
                <Mic className="size-5" /> Start session
              </motion.button>
            ) : (
              <>
                <button className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:bg-white/[0.08]">
                  <Pause className="size-5" />
                </button>
                <button className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:bg-white/[0.08]">
                  <Volume2 className="size-5" />
                </button>
                <motion.button
                  whileHover={ { scale: 1.05 } }
                  whileTap={ { scale: 0.95 } }
                  onClick={() => setActive(false)}
                  className="grid size-16 place-items-center rounded-full bg-rose-500 text-white shadow-[0_0_40px_-8px_rgba(244,63,94,0.7)]"
                >
                  <Phone className="size-6 rotate-[135deg]" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Live transcript */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={ { opacity: 0, y: 30 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: 30 } }
              className="glass-strong absolute bottom-6 z-10 w-full max-w-lg rounded-2xl p-4"
            >
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Live transcript
              </p>
              <div className="space-y-2">
                {transcript.map((t, i) => (
                  <p
                    key={i}
                    className={cn(
                      "text-sm",
                      t.role === "user"
                        ? "text-foreground/80"
                        : "text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 font-medium",
                        t.role === "user" ? "text-muted-foreground" : "text-primary",
                      )}
                    >
                      {t.role === "user" ? "You" : "Nyay"}
                    </span>
                    {t.text}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
