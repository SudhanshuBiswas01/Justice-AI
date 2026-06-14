"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  PanelLeftClose,
  PanelLeft,
  Settings,
  LifeBuoy,
  Plus,
} from "lucide-react"
import { Logo } from "./logo"
import { dashboardNav } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <motion.aside
      animate={ { width: collapsed ? 78 : 264 } }
      transition={ { type: "spring", stiffness: 260, damping: 30 } }
      className="glass relative z-20 hidden h-screen shrink-0 flex-col gap-2 overflow-hidden border-r border-white/10 p-3 md:flex"
    >
      <div className="flex items-center justify-between px-2 py-3">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="full"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
            >
              <Logo />
            </motion.div>
          ) : (
            <motion.div
              key="mark"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
            >
              <Logo showWordmark={false} />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      </div>

      <Button
        className={cn("mb-2", collapsed && "size-12 p-0")}
        size={collapsed ? "icon" : "default"}
      >
        <Plus className="size-4" />
        {!collapsed && <span>New matter</span>}
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
        {dashboardNav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.06]"
                  transition={ { type: "spring", stiffness: 300, damping: 30 } }
                />
              )}
              <Icon className="relative z-10 size-5 shrink-0" />
              {!collapsed && (
                <span className="relative z-10 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        <SidebarLink icon={Settings} label="Settings" collapsed={collapsed} />
        <SidebarLink icon={LifeBuoy} label="Support" collapsed={collapsed} />
      </div>
    </motion.aside>
  )
}

function SidebarLink({
  icon: Icon,
  label,
  collapsed,
}: {
  icon: typeof Settings
  label: string
  collapsed: boolean
}) {
  return (
    <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  )
}
