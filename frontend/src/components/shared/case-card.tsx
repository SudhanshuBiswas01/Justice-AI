"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Clock } from "lucide-react"
import type { CaseRecord } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusVariant: Record<
  CaseRecord["status"],
  React.ComponentProps<typeof Badge>["variant"]
> = {
  Active: "primary",
  Review: "warning",
  Filed: "success",
  Closed: "outline",
}

export function CaseCard({ record }: { record: CaseRecord }) {
  return (
    <motion.article
      whileHover={ { y: -4 } }
      transition={ { type: "spring", stiffness: 300, damping: 22 } }
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">
            {record.id}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold leading-snug">
            {record.title}
          </h3>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
        <span className="text-xs text-muted-foreground">{record.type}</span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span>{record.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={ { width: 0 } }
            whileInView={ { width: `${record.progress}%` } }
            viewport={ { once: true } }
            transition={ { duration: 1, ease: [0.16, 1, 0.3, 1] } }
            className="h-full rounded-full bg-brand-gradient"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-muted-foreground">{record.client}</span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          {record.updated}
        </span>
      </div>
    </motion.article>
  )
}
