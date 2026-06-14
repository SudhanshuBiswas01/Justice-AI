"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Ambient cinematic backdrop: animated aurora glow blobs + subtle grid.
 * Sits behind page content (pointer-events disabled).
 */
export function AmbientBackground({
  className,
  variant = "default",
}: {
  className?: string
  variant?: "default" | "intense" | "calm"
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid mask-radial opacity-[0.35]" />

      {/* Aurora blobs */}
      <motion.div
        className="glow-blob left-[-10%] top-[-10%] h-[40rem] w-[40rem] bg-primary/25"
        animate={ { x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] } }
        transition={ { duration: 20, repeat: Infinity, ease: "easeInOut" } }
      />
      <motion.div
        className="glow-blob right-[-5%] top-[20%] h-[34rem] w-[34rem] bg-accent/20"
        animate={ { x: [0, -50, 30, 0], y: [0, 40, -20, 0], scale: [1, 0.9, 1.1, 1] } }
        transition={ { duration: 24, repeat: Infinity, ease: "easeInOut" } }
      />
      <motion.div
        className={cn(
          "glow-blob bottom-[-15%] left-[30%] h-[36rem] w-[36rem] bg-fuchsia-500/15",
          variant === "intense" && "bg-fuchsia-500/25",
          variant === "calm" && "bg-fuchsia-500/8",
        )}
        animate={ { x: [0, 40, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.9, 1] } }
        transition={ { duration: 28, repeat: Infinity, ease: "easeInOut" } }
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(230_35%_5%_/_0.85))]" />
    </div>
  )
}
