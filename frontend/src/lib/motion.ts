import type { Variants, Transition } from "framer-motion"

/** Premium spring used across interactive elements. */
export const spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
}

/** Buttery cubic-bezier easing (Apple-like). */
export const ease = [0.16, 1, 0.3, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
}

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease },
  },
}

/** Stagger container — reveals children one after another. */
export const stagger = (staggerChildren = 0.09, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
})

export const viewportOnce = { once: true, amount: 0.3 } as const
