"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ConfidenceBadgeProps {
  confidence: number   // 0.0 – 1.0
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100)

  const tier =
    confidence >= 0.8
      ? { label: "High Confidence", emoji: "🟢", color: "emerald" }
      : confidence >= 0.6
      ? { label: "Medium Confidence", emoji: "🟡", color: "amber" }
      : { label: "Low Confidence — consult a lawyer", emoji: "🔴", color: "red" }

  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
  }

  const barMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-400",
    red: "bg-red-500",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-4 py-3",
        colorMap[tier.color],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {tier.emoji} {tier.label}
        </span>
        <span className="font-mono text-sm font-semibold">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", barMap[tier.color])}
        />
      </div>
    </motion.div>
  )
}
