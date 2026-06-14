"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type VoiceState = "idle" | "listening" | "thinking" | "speaking"

const stateConfig: Record<VoiceState, { scale: number[]; duration: number }> = {
  idle: { scale: [1, 1.04, 1], duration: 5 },
  listening: { scale: [1, 1.12, 1.02, 1.1, 1], duration: 1.6 },
  thinking: { scale: [1, 1.05, 0.98, 1.05, 1], duration: 2.2 },
  speaking: { scale: [1, 1.16, 1.04, 1.14, 1], duration: 1.1 },
}

/**
 * The signature Nyay Voice AI orb — a living, breathing gradient sphere with
 * layered pulse rings, rotating conic light and state-driven motion.
 */
export function VoiceOrb({
  state,
  className,
}: {
  state: VoiceState
  className?: string
}) {
  const cfg = stateConfig[state]
  const animated = state !== "idle"

  return (
    <div className={cn("relative grid place-items-center", className)}>
      {/* Pulse rings */}
      {animated &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute size-64 rounded-full border border-primary/30"
            initial={ { scale: 0.8, opacity: 0.6 } }
            animate={ { scale: 1.8, opacity: 0 } }
            transition={ {
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeOut",
            } }
          />
        ))}

      {/* Ambient glow */}
      <motion.div
        className="absolute size-72 rounded-full bg-primary/30 blur-3xl"
        animate={ { opacity: animated ? [0.4, 0.7, 0.4] : 0.3 } }
        transition={ { duration: cfg.duration, repeat: Infinity } }
      />

      {/* Rotating conic ring */}
      <motion.div
        className="absolute size-60 rounded-full"
        style={ {
          background:
            "conic-gradient(from 0deg, transparent, hsl(var(--primary)), hsl(var(--accent)), transparent)",
          maskImage:
            "radial-gradient(closest-side, transparent 78%, #000 80%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, transparent 78%, #000 80%)",
        } }
        animate={ { rotate: 360 } }
        transition={ { duration: state === "speaking" ? 4 : 12, repeat: Infinity, ease: "linear" } }
      />

      {/* Core sphere */}
      <motion.div
        className="relative size-52 overflow-hidden rounded-full"
        animate={ { scale: cfg.scale } }
        transition={ { duration: cfg.duration, repeat: Infinity, ease: "easeInOut" } }
        style={ {
          background:
            "radial-gradient(circle at 30% 25%, #a5b4fc, #6366f1 35%, #4338ca 70%, #1e1b4b)",
          boxShadow:
            "inset 0 -20px 60px rgba(0,0,0,0.5), 0 0 80px hsl(var(--primary) / 0.5)",
        } }
      >
        {/* Inner swirling highlight */}
        <motion.div
          className="absolute inset-0"
          animate={ { rotate: animated ? 360 : 0 } }
          transition={ { duration: 8, repeat: Infinity, ease: "linear" } }
          style={ {
            background:
              "radial-gradient(circle at 70% 70%, hsl(var(--accent) / 0.55), transparent 50%)",
          } }
        />
        <div className="absolute left-[22%] top-[18%] size-16 rounded-full bg-white/40 blur-xl" />
      </motion.div>
    </div>
  )
}
