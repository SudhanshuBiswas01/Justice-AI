"use client"

import { motion } from "framer-motion"
import { features } from "@/lib/data"
import { SectionHeading } from "@/components/shared/section-heading"
import { fadeUp, stagger, viewportOnce } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionHeading
        eyebrow="Capabilities"
        title={
          <>
            One platform. <span className="text-gradient">Every legal task.</span>
          </>
        }
        description="From conversational research to voice sessions and document intelligence — Justice AI brings your entire practice into one cinematic workspace."
      />

      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              whileHover={ { y: -6 } }
              transition={ { type: "spring", stiffness: 300, damping: 22 } }
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div
                className={cn(
                  "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40",
                  feature.accent,
                )}
              />
              <div
                className={cn(
                  "mb-5 grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  feature.accent,
                )}
              >
                <Icon className="size-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          )
        })}
      </motion.div>
    </section>
  )
}
