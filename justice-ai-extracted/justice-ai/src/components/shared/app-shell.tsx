"use client"

import * as React from "react"
import Link from "next/link"
import { Bell, Sparkles } from "lucide-react"
import { Sidebar } from "./sidebar"
import { AmbientBackground } from "./ambient-background"
import { SearchBar } from "./search-bar"
import { PageTransition } from "./page-transition"
import { Badge } from "@/components/ui/badge"

/**
 * Shared authenticated app frame: animated sidebar + glass topbar + ambient
 * background. Wraps dashboard, chat, voice and OCR pages.
 */
export function AppShell({
  children,
  title,
  showSearch = true,
}: {
  children: React.ReactNode
  title: string
  showSearch?: boolean
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AmbientBackground variant="calm" />
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass z-10 flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-semibold">{title}</h1>
            <Badge variant="primary" className="hidden sm:inline-flex">
              <Sparkles className="size-3" /> Beta
            </Badge>
          </div>

          {showSearch && (
            <div className="hidden max-w-md flex-1 md:block">
              <SearchBar />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button className="relative grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
              <Bell className="size-5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" />
            </button>
            <Link
              href="/"
              className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-sm font-semibold text-white shadow-glow"
            >
              SB
            </Link>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
