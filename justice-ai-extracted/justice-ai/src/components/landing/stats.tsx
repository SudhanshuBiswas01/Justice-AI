"use client"

import { motion } from "framer-motion"
import { stats } from "@/lib/data"
import { fadeUp, stagger, viewportOnce } from "@/lib/motion"

export function Stats() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12">
      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            className="glass-card flex flex-col items-center gap-1 p-6 text-center"
          >
            <span className="font-display text-4xl font-semibold text-gradient">
              {s.value}
            </span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
