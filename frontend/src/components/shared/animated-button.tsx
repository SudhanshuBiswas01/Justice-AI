"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Premium CTA with magnetic hover, animated sheen sweep and spring press.
 */
export function AnimatedButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const ref = React.useRef<HTMLButtonElement>(null)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })

  function handleMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    setOffset({ x: x * 0.25, y: y * 0.35 })
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={ { x: offset.x, y: offset.y } }
      transition={ { type: "spring", stiffness: 200, damping: 15 } }
      whileTap={ { scale: 0.96 } }
      className={cn(
        "group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-gradient bg-[length:200%_200%] px-8 text-base font-medium text-white shadow-glow transition-[box-shadow] duration-300 hover:shadow-glow-lg",
        className,
      )}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </motion.button>
  )
}
