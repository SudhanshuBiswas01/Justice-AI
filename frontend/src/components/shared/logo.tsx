import { Scale } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <Scale className="size-5 text-white" />
        <div className="absolute inset-0 rounded-xl bg-brand-gradient blur-md opacity-60 -z-10" />
      </div>
      {showWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Justice<span className="text-gradient"> AI</span>
        </span>
      )}
    </div>
  )
}
