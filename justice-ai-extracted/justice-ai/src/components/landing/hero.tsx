"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Scale, Mic, ScanLine } from "lucide-react"
import { AnimatedButton } from "@/components/shared/animated-button"
import { Button } from "@/components/ui/button"
import { ease } from "@/lib/motion"

export function Hero() {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92])

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-28"
    >
      <motion.div
        style={ { y, opacity, scale } }
        className="relative z-10 flex flex-col items-center text-center"
      >
        <motion.div
          initial={ { opacity: 0, y: 20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.7, ease } }
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-xl"
        >
          <Sparkles className="size-3.5 text-accent" />
          Introducing Nyay Voice AI — your spoken legal copilot
        </motion.div>

        <motion.h1
          initial={ { opacity: 0, y: 30, filter: "blur(10px)" } }
          animate={ { opacity: 1, y: 0, filter: "blur(0px)" } }
          transition={ { duration: 0.9, ease } }
          className="max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
        >
          Legal intelligence,
          <br />
          <span className="text-gradient-animate">reimagined by AI.</span>
        </motion.h1>

        <motion.p
          initial={ { opacity: 0, y: 24 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.9, delay: 0.15, ease } }
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          Justice AI understands statutes, precedent and your documents — then
          answers in plain language with verifiable sources. Chat, speak or scan.
        </motion.p>

        <motion.div
          initial={ { opacity: 0, y: 24 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.9, delay: 0.3, ease } }
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <AnimatedButton onClick={() => undefined}>
            <Link href="/auth" className="flex items-center gap-2">
              Start for free <ArrowRight className="size-4" />
            </Link>
          </AnimatedButton>
          <Button asChild variant="secondary" size="lg">
            <Link href="/dashboard">Explore the product</Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Floating legal / AI glyphs */}
      <FloatingGlyph className="left-[12%] top-[30%]" delay={0}>
        <Scale className="size-6 text-primary" />
      </FloatingGlyph>
      <FloatingGlyph className="right-[14%] top-[26%]" delay={1.2}>
        <Mic className="size-6 text-accent" />
      </FloatingGlyph>
      <FloatingGlyph className="left-[18%] bottom-[24%]" delay={0.6}>
        <ScanLine className="size-6 text-fuchsia-400" />
      </FloatingGlyph>
      <FloatingGlyph className="right-[16%] bottom-[28%]" delay={1.8}>
        <Sparkles className="size-6 text-emerald-300" />
      </FloatingGlyph>

      {/* Hero product preview */}
      <motion.div
        initial={ { opacity: 0, y: 80, rotateX: 20 } }
        animate={ { opacity: 1, y: 0, rotateX: 0 } }
        transition={ { duration: 1.1, delay: 0.4, ease } }
        style={ { perspective: 1200 } }
        className="relative z-10 mt-16 w-full max-w-5xl"
      >
        <div className="gradient-border glass-strong rounded-3xl p-2 shadow-glow-lg">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0b14]">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="size-3 rounded-full bg-rose-400/70" />
              <span className="size-3 rounded-full bg-amber-400/70" />
              <span className="size-3 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-xs text-muted-foreground">
                justice.ai / chat
              </span>
            </div>
            <div className="grid gap-3 p-6">
              <div className="ml-auto max-w-[60%] rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm">
                Is a 90-day notice period enforceable in my lease?
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground/90">
                Generally yes — if the clause is clearly stated and mutually
                signed. Under the Transfer of Property Act, notice terms are
                binding when reasonable.
                <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">
                  1
                </span>
              </div>
              <div className="flex gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-primary" />
                <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
                <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-24 bg-primary/30 blur-3xl" />
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        animate={ { y: [0, 8, 0] } }
        transition={ { duration: 2, repeat: Infinity } }
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
          <div className="size-1.5 rounded-full bg-white/60" />
        </div>
      </motion.div>
    </section>
  )
}

function FloatingGlyph({
  children,
  className,
  delay,
}: {
  children: React.ReactNode
  className?: string
  delay: number
}) {
  return (
    <motion.div
      initial={ { opacity: 0, scale: 0 } }
      animate={ { opacity: 1, scale: 1, y: [0, -16, 0] } }
      transition={ {
        opacity: { duration: 0.6, delay: delay * 0.3 + 0.5 },
        scale: { duration: 0.6, delay: delay * 0.3 + 0.5 },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      } }
      className={`absolute hidden size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl lg:grid ${className}`}
    >
      {children}
    </motion.div>
  )
}
