"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type VoiceState = "idle" | "listening" | "thinking" | "speaking"

export function Waveform({
  state,
  bars = 48,
  className,
}: {
  state: VoiceState
  bars?: number
  className?: string
}) {
  const active = state === "listening" || state === "speaking"

  return (
    <div
      className={cn(
        "flex h-16 items-center justify-center gap-[3px]",
        className,
      )}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const distance = Math.abs(i - bars / 2)
        const baseHeight = Math.max(6, 42 - distance * 1.4)
        return (
          <motion.span
            key={i}
            className={cn(
              "w-[3px] rounded-full",
              state === "speaking" ? "bg-accent" : "bg-primary",
            )}
            animate={
              active
                ? {
                    height: [
                      baseHeight * 0.3,
                      baseHeight,
                      baseHeight * 0.5,
                      baseHeight * 0.85,
                      baseHeight * 0.3,
                    ],
                    opacity: [0.5, 1, 0.7, 1, 0.5],
                  }
                : { height: 5, opacity: 0.3 }
            }
            transition={
              active
                ? {
                    duration: 0.9 + (i % 5) * 0.12,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : { duration: 0.3 }
            }
          />
        )
      })}
    </div>
  )
}
