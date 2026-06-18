"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ResearchCitation {
  ref: number
  title: string
  act_name: string
  section: string
  source: string
}

interface ResearchReportProps {
  report: string
  citations: ResearchCitation[]
  passes: number
  className?: string
}

export function ResearchReport({ report, citations, passes, className }: ResearchReportProps) {
  const [citationsOpen, setCitationsOpen] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex flex-col gap-4", className)}
    >
      {/* Pass indicator */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-300">
          🔁 {passes === 1 ? "1 research pass" : `${passes} research passes (refined)`}
        </span>
      </div>

      {/* Markdown report */}
      <div className="glass-card prose prose-invert prose-sm max-w-none rounded-2xl p-6 text-foreground/90 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_blockquote]:border-l-amber-400/60 [&_blockquote]:text-amber-200/80">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>

      {/* Citations accordion */}
      {citations.length > 0 && (
        <div className="rounded-xl border border-white/10">
          <button
            onClick={() => setCitationsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="font-medium">
              📚 Legal References ({citations.length})
            </span>
            {citationsOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>

          {citationsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 border-t border-white/10 p-4"
            >
              {citations.map((c) => (
                <div
                  key={c.ref}
                  className="flex flex-wrap items-start gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px]"
                >
                  <span className="font-semibold text-zinc-300">[{c.ref}]</span>
                  {c.act_name && (
                    <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-medium text-violet-300">
                      {c.act_name}
                    </span>
                  )}
                  {c.section && (
                    <span className="rounded bg-cyan-500/12 px-1.5 py-0.5 font-medium text-cyan-300">
                      § {c.section}
                    </span>
                  )}
                  <span className="truncate text-zinc-400">{c.title}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}
