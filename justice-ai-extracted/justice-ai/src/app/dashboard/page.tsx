"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  MessageSquareText,
  Mic,
  ScanLine,
  TrendingUp,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { FloatingCard } from "@/components/shared/floating-card"
import { CaseCard } from "@/components/shared/case-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cases } from "@/lib/data"
import { fadeUp, stagger, viewportOnce } from "@/lib/motion"

const quickActions = [
  {
    title: "Ask Justice AI",
    desc: "Research statutes & precedent",
    icon: MessageSquareText,
    href: "/chat",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    title: "Nyay Voice",
    desc: "Start a voice session",
    icon: Mic,
    href: "/voice",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Analyze document",
    desc: "OCR contracts & notices",
    icon: ScanLine,
    href: "/ocr",
    accent: "from-cyan-400 to-sky-500",
  },
]

const metrics = [
  { label: "Active matters", value: "12", trend: "+3 this week", icon: FileText },
  { label: "Hours saved", value: "148", trend: "+22% MoM", icon: Clock },
  { label: "Avg. accuracy", value: "99.2%", trend: "Verified", icon: TrendingUp },
]

export default function DashboardPage() {
  return (
    <AppShell title="Overview">
      <div className="mx-auto max-w-6xl space-y-10 px-5 py-8">
        {/* Greeting */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-1"
        >
          <h2 className="font-display text-3xl font-semibold">
            Good to see you, <span className="text-gradient">Sudhanshu</span>
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s moving across your practice today.
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-3"
        >
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <motion.div key={a.title} variants={fadeUp}>
                <Link href={a.href}>
                  <FloatingCard className="h-full">
                    <div className="p-6">
                      <div
                        className={`mb-10 grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${a.accent} text-white shadow-lg`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {a.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {a.desc}
                          </p>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground" />
                      </div>
                    </div>
                  </FloatingCard>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Metrics */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid gap-4 sm:grid-cols-3"
        >
          {metrics.map((m) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.label}
                variants={fadeUp}
                className="glass-card flex items-center gap-4 p-5"
              >
                <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold">
                    {m.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
                <span className="ml-auto text-[11px] text-emerald-300">
                  {m.trend}
                </span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Cases */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Recent matters</h3>
            <Link
              href="#"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-4 sm:grid-cols-2"
          >
            {cases.map((c) => (
              <motion.div key={c.id} variants={fadeUp}>
                <CaseCard record={c} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Loading state demo */}
        <div>
          <h3 className="mb-4 font-display text-xl font-semibold">
            Insights <span className="text-sm font-normal text-muted-foreground">syncing…</span>
          </h3>
          <div className="glass-card space-y-4 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
