"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BrainCircuit, ChevronDown, ChevronUp, Terminal } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { ChatComposer } from "@/components/chat/chat-composer"
import { AgentStepper } from "@/components/deep-research/agent-stepper"
import { ConfidenceBadge } from "@/components/deep-research/confidence-badge"
import { ResearchReport, type ResearchCitation } from "@/components/deep-research/research-report"

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeepResearchResult {
  report: string
  citations: ResearchCitation[]
  confidence: number
  passes: number
  source_type: string
  agent_log: string[]
}

// ── Suggestions ───────────────────────────────────────────────────────────────

const suggestions = [
  "Is my ₹1,000 traffic challan for no-helmet legally valid?",
  "Retailer charged ₹40 above MRP — what law protects me?",
  "Amazon refused my refund after 30 days. What are my rights?",
  "How do I file a complaint in the National Consumer Forum?",
]

// ── Step advance timing (ms) — simulated while we wait for the API ─────────────
// Steps: 1=Orchestrator, 2=Research, 3=Analysis, 4=Verifier, 5=Done
const STEP_DELAYS = [0, 600, 2000, 5000]

export default function DeepResearchPage() {
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [activeStep, setActiveStep] = React.useState(0)
  const [result, setResult] = React.useState<DeepResearchResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [logOpen, setLogOpen] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimers = React.useRef<ReturnType<typeof setTimeout>[]>([])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Elapsed timer
  React.useEffect(() => {
    if (loading) {
      const t0 = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loading])

  // Scroll to result
  React.useEffect(() => {
    if (result) {
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100)
    }
  }, [result])

  function advanceStepsSimulated() {
    // Advance through steps with fixed delays so the UI feels alive while the API runs
    STEP_DELAYS.forEach((delay, idx) => {
      const t = setTimeout(() => setActiveStep(idx + 1), delay)
      stepTimers.current.push(t)
    })
  }

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []
  }

  async function run(value: string) {
    if (!value.trim() || loading) return
    setQuery(value)
    setLoading(true)
    setResult(null)
    setError(null)
    setActiveStep(0)
    setLogOpen(false)
    clearStepTimers()
    advanceStepsSimulated()

    try {
      const resp = await fetch("/api/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: value }] }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error || `Server error ${resp.status}`)
      }

      const data: DeepResearchResult = await resp.json()
      clearStepTimers()
      setActiveStep(5) // mark all done
      setResult(data)
    } catch (err: any) {
      clearStepTimers()
      setActiveStep(0)
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = !loading && !result && !error

  return (
    <AppShell title="Deep Research" showSearch={false}>
      <div ref={scrollRef} className="flex h-full flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center pt-8 text-center"
            >
              <div className="relative mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_32px_rgba(139,92,246,0.35)]">
                <BrainCircuit className="size-8 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-xl opacity-40 -z-10" />
              </div>
              <h2 className="font-display text-3xl font-semibold">Deep Research Mode</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                4 AI agents collaborate — Orchestrator, Research, Analysis, and Verifier — to
                produce a thorough, cited legal report with a confidence score.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300">
                ⏱ Takes 15–40 seconds · Much more thorough than normal Chat
              </div>

              <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    whileHover={{ y: -3 }}
                    onClick={() => run(s)}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <BrainCircuit className="mt-0.5 size-4 shrink-0 text-violet-400" />
                    <span className="text-foreground/90">{s}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Loading / agent stepper ───────────────────────────────────── */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="mb-1 text-sm font-medium text-foreground/80">Your question</p>
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                  {query}
                </p>
              </div>

              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <span>Agents working</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {elapsed.toFixed(1)}s
                  </span>
                </p>
                <AgentStepper activeStep={activeStep} />
              </div>
            </motion.div>
          )}

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              ❌ {error}
            </motion.div>
          )}

          {/* ── Result ────────────────────────────────────────────────────── */}
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-5"
            >
              {/* Header */}
              <div>
                <p className="mb-1 text-sm font-medium text-foreground/80">Research query</p>
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                  {query}
                </p>
              </div>

              {/* Confidence */}
              <ConfidenceBadge confidence={result.confidence} />

              {/* Report */}
              <ResearchReport
                report={result.report}
                citations={result.citations}
                passes={result.passes}
              />

              {/* Agent log accordion */}
              {result.agent_log && result.agent_log.length > 0 && (
                <div className="rounded-xl border border-white/10">
                  <button
                    onClick={() => setLogOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Terminal className="size-3.5" />
                      Agent Log ({result.agent_log.length} events)
                    </span>
                    {logOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  <AnimatePresence>
                    {logOpen && (
                      <motion.div
                        key="log"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-white/10"
                      >
                        <div className="flex flex-col gap-1 p-4">
                          {result.agent_log.map((line, i) => (
                            <p key={i} className="font-mono text-[11px] text-muted-foreground">
                              {line}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* New research button */}
              <button
                onClick={() => { setResult(null); setQuery(""); setActiveStep(0) }}
                className="self-start rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
              >
                ＋ New research query
              </button>
            </motion.div>
          )}
        </div>

        {/* Composer fixed at bottom */}
        <div className="sticky bottom-0 mt-auto">
          <ChatComposer
            onSend={run}
            disabled={loading}
          />
        </div>
      </div>
    </AppShell>
  )
}
