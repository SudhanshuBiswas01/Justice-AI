import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Source transparency badge — communicates that an answer is grounded and
 * verifiable. Trust signal used across chat + voice answers.
 */
export function SourceBadge({
  count,
  verified = true,
  className,
}: {
  count: number
  verified?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        verified
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/5 text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck className="size-3" />
      {verified ? "Verified" : "Unverified"} · {count} source{count === 1 ? "" : "s"}
    </span>
  )
}
