"use client"

import * as React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Mic } from "lucide-react"
import { SectionHeading } from "@/components/shared/section-heading"
import { VoiceOrb } from "@/components/voice/voice-orb"
import { Waveform } from "@/components/voice/waveform"

export function Showcase() {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const yLeft = useTransform(scrollYProgress, [0, 1], [60, -60])
  const yRight = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section id="voice" ref={ref} className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionHeading
        eyebrow="Nyay Voice AI"
        title={
          <>
            Just speak. <span className="text-gradient">It listens, thinks, responds.</span>
          </>
        }
        description="A cinematic voice interface that turns legal questions into spoken guidance — with a living orb and real-time waveform."
      />

      <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
        <motion.div style={ { y: yLeft } } className="flex justify-center">
          <div className="glass-card relative flex aspect-square w-full max-w-md flex-col items-center justify-center gap-6 overflow-hidden p-8">
            <VoiceOrb state="speaking" className="scale-90" />
            <Waveform state="speaking" className="w-full max-w-xs" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              <Mic className="size-3 text-accent" /> Nyay is speaking…
            </span>
          </div>
        </motion.div>

        <motion.div style={ { y: yRight } } className="flex flex-col gap-4">
          {[
            {
              t: "Cinematic states",
              d: "Listening, thinking and speaking each have their own choreography of motion and light.",
            },
            {
              t: "Live waveform",
              d: "A real-time visualizer reacts to the conversation, making sessions feel alive.",
            },
            {
              t: "Grounded answers",
              d: "Every spoken response is backed by the same verifiable sources as chat.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.t}
              initial={ { opacity: 0, x: 30 } }
              whileInView={ { opacity: 1, x: 0 } }
              viewport={ { once: true } }
              transition={ { duration: 0.6, delay: i * 0.1 } }
              className="glass-card p-6"
            >
              <h3 className="font-display text-lg font-semibold">{item.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
