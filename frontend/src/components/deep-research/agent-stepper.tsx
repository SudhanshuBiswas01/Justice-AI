"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Scale, Brain, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type AgentStep = {
  id: string
  label: string
  sublabel: string
  icon: React.ElementType
  status: "idle" | "running" | "done" | "error"
}

const DEFAULT_STEPS: AgentStep[] = [
  {
    id: "orchestrator",
    label: "Orchestrator",
    sublabel: "Routing your question…",
    icon: Brain,
    status: "idle",
  },
  {
    id: "research",
    label: "Research Agent",
    sublabel: "Searching legal corpus…",
    icon: Search,
    status: "idle",
  },
  {
    id: "analysis",
    label: "Analysis Agent",
    sublabel: "Drafting legal report…",
    icon: Scale,
    status: "idle",
  },
  {
    id: "verifier",
    label: "Verifier Agent",
    sublabel: "Checking citations…",
    icon: CheckCircle2,
    status: "idle",
  },
]

interface AgentStepperProps {
  /** 0 = idle, 1 = orchestrator running, 2 = research, 3 = analysis, 4 = verifier, 5 = done */
  activeStep: number
  className?: string
}

export function AgentStepper({ activeStep, className }: AgentStepperProps) {
  const steps = DEFAULT_STEPS.map((s, idx) => ({
    ...s,
    status:
      activeStep === 0
        ? "idle"
        : idx + 1 < activeStep
        ? "done"
        : idx + 1 === activeStep
        ? "running"
        : "idle",
  })) as AgentStep[]

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {steps.map((step, idx) => {
        const Icon = step.icon
        const isDone = step.status === "done"
        const isRunning = step.status === "running"

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: activeStep > 0 ? 1 : 0.4, x: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.3 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              isDone
                ? "border-emerald-500/30 bg-emerald-500/8"
                : isRunning
                ? "border-indigo-500/40 bg-indigo-500/10"
                : "border-white/8 bg-white/[0.02]"
            )}
          >
            {/* Icon / status indicator */}
            <div
              className={cn(
                "relative grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                isDone
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isRunning
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-white/5 text-muted-foreground"
              )}
            >
              {isRunning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isDone ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Icon className="size-4" />
              )}
              {/* Pulse ring when running */}
              {isRunning && (
                <span className="absolute inset-0 animate-ping rounded-lg bg-indigo-500/20" />
              )}
            </div>

            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isDone
                    ? "text-emerald-300"
                    : isRunning
                    ? "text-indigo-300"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              {isRunning && (
                <p className="text-[11px] text-muted-foreground">{step.sublabel}</p>
              )}
            </div>

            {isDone && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto text-[11px] font-medium text-emerald-400"
              >
                Done
              </motion.span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
