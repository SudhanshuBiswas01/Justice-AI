"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Command } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchBar({
  placeholder = "Search cases, statutes, documents…",
  className,
}: {
  placeholder?: string
  className?: string
}) {
  const [focused, setFocused] = React.useState(false)

  return (
    <motion.div
      animate={ { scale: focused ? 1.01 : 1 } }
      transition={ { type: "spring", stiffness: 300, damping: 24 } }
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300",
        focused
          ? "border-primary/50 bg-white/[0.06] shadow-glow"
          : "border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      <Search
        className={cn(
          "size-4 transition-colors",
          focused ? "text-primary" : "text-muted-foreground",
        )}
      />
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
      />
      <kbd className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:flex">
        <Command className="size-3" />K
      </kbd>
    </motion.div>
  )
}
