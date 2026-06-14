"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * A glassmorphic card with 3D hover physics — tilts toward the cursor and
 * lifts with an ambient glow. Inspired by Linear / Arc surfaces.
 */
export function FloatingCard({
  children,
  className,
  intensity = 10,
}: {
  children: React.ReactNode
  className?: string
  intensity?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 200,
    damping: 20,
  })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={ { rotateX, rotateY, transformStyle: "preserve-3d" } }
      className={cn(
        "group relative rounded-3xl border border-white/10 bg-white/[0.04] p-px backdrop-blur-xl will-change-transform",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={ { background: "radial-gradient(400px circle at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%)" } }
      />
      <div style={ { transform: "translateZ(40px)" } } className="relative h-full">
        {children}
      </div>
    </motion.div>
  )
}
