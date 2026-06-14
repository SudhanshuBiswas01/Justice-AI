"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { ease } from "@/lib/motion"

/**
 * Wraps page content with a cinematic enter transition that re-fires on route
 * change (keyed by pathname).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <motion.div
      key={pathname}
      initial={ { opacity: 0, y: 16, filter: "blur(8px)" } }
      animate={ { opacity: 1, y: 0, filter: "blur(0px)" } }
      transition={ { duration: 0.6, ease } }
    >
      {children}
    </motion.div>
  )
}
