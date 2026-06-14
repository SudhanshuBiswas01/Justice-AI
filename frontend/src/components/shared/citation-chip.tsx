"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

export type Citation = {
  index: number
  title: string
  source: string
  snippet?: string
}

export function CitationChip({
  citation,
  className,
}: {
  citation: Citation
  className?: string
}) {
  const [hover, setHover] = React.useState(false)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.button
        whileHover={ { y: -1 } }
        whileTap={ { scale: 0.95 } }
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 align-middle text-[11px] font-medium text-primary transition-colors hover:bg-primary/25",
          className,
        )}
      >
        <FileText className="size-2.5" />
        {citation.index}
      </motion.button>

      <AnimatePresence>
        {hover && (
          <motion.span
            initial={ { opacity: 0, y: 6, scale: 0.96 } }
            animate={ { opacity: 1, y: 0, scale: 1 } }
            exit={ { opacity: 0, y: 6, scale: 0.96 } }
            transition={ { duration: 0.18 } }
            className="glass-strong absolute bottom-full left-1/2 z-50 mb-2 block w-64 -translate-x-1/2 rounded-xl p-3 text-left shadow-glass"
          >
            <span className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {citation.title}
              </span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </span>
            <span className="mt-1 block text-[11px] text-accent">
              {citation.source}
            </span>
            {citation.snippet && (
              <span className="mt-1.5 block text-[11px] leading-relaxed text-muted-foreground">
                {citation.snippet}
              </span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
