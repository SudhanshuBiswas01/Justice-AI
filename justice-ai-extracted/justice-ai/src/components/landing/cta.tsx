"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { AnimatedButton } from "@/components/shared/animated-button"
import { viewportOnce } from "@/lib/motion"

export function CTA() {
  return (
    <section id="pricing" className="relative mx-auto max-w-5xl px-4 py-28">
      <motion.div
        initial={ { opacity: 0, y: 40 } }
        whileInView={ { opacity: 1, y: 0 } }
        viewport={viewportOnce}
        transition={ { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
        className="gradient-border relative overflow-hidden rounded-[2rem] bg-white/[0.03] p-12 text-center backdrop-blur-xl sm:p-16"
      >
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
        <div className="glow-blob left-1/2 top-0 size-72 -translate-x-1/2 bg-primary/30" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Build your practice on a
            <span className="text-gradient"> billion-dollar AI engine.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Join the firms moving faster with Justice AI. Start free — no card
            required.
          </p>
          <div className="mt-9 flex justify-center">
            <AnimatedButton>
              <Link href="/auth" className="flex items-center gap-2">
                Get started <ArrowRight className="size-4" />
              </Link>
            </AnimatedButton>
          </div>
        </div>
      </motion.div>

      <footer className="mt-20 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Justice AI. Crafted for a new era of law.</p>
      </footer>
    </section>
  )
}
