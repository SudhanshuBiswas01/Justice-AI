"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { spring } from "@/lib/motion"

type ToastTone = "success" | "error" | "info"
type Toast = { id: number; title: string; description?: string; tone: ToastTone }

type ToastContext = {
  toast: (t: Omit<Toast, "id">) => void
}

const Ctx = React.createContext<ToastContext | null>(null)

export function useToast() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>")
  return ctx
}

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const toneClasses: Record<ToastTone, string> = {
  success: "text-emerald-300",
  error: "text-rose-300",
  info: "text-accent",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((x) => x.id !== id))

  return (
    <Ctx.Provider value={ { toast } }>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(92vw,360px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={ { opacity: 0, x: 40, scale: 0.9 } }
                animate={ { opacity: 1, x: 0, scale: 1 } }
                exit={ { opacity: 0, x: 40, scale: 0.9 } }
                transition={spring}
                className="glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-glass"
              >
                <Icon className={cn("mt-0.5 size-5 shrink-0", toneClasses[t.tone])} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}
