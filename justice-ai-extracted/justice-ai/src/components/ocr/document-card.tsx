"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, CheckCircle2, Loader2, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"

export type DocStatus = "uploading" | "scanning" | "done"

export type DocItem = {
  id: string
  name: string
  size: string
  status: DocStatus
  progress: number
}

export function DocumentCard({ doc }: { doc: DocItem }) {
  return (
    <motion.div
      layout
      initial={ { opacity: 0, y: 16, scale: 0.97 } }
      animate={ { opacity: 1, y: 0, scale: 1 } }
      exit={ { opacity: 0, scale: 0.97 } }
      transition={ { type: "spring", stiffness: 280, damping: 26 } }
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      {/* Scanning beam */}
      <AnimatePresence>
        {doc.status === "scanning" && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-accent/0 via-accent/25 to-accent/0"
            initial={ { top: "-20%" } }
            animate={ { top: "110%" } }
            exit={ { opacity: 0 } }
            transition={ { duration: 1.4, repeat: Infinity, ease: "easeInOut" } }
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
          <FileText className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {doc.name}
          </p>
          <p className="text-[11px] text-muted-foreground">{doc.size}</p>
        </div>
        <StatusPill status={doc.status} />
      </div>

      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={cn(
            "h-full rounded-full",
            doc.status === "done" ? "bg-emerald-400" : "bg-brand-gradient",
          )}
          animate={ { width: `${doc.progress}%` } }
          transition={ { ease: "easeOut" } }
        />
      </div>
    </motion.div>
  )
}

function StatusPill({ status }: { status: DocStatus }) {
  if (status === "done")
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
        <CheckCircle2 className="size-3.5" /> Analyzed
      </span>
    )
  if (status === "scanning")
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
        <ScanLine className="size-3.5" /> Scanning
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" /> Uploading
    </span>
  )
}
