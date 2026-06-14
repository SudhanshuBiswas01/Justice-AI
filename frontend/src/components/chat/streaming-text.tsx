"use client"

import * as React from "react"
import { motion } from "framer-motion"

/**
 * Renders text with a token-by-token streaming reveal + blinking caret —
 * the ChatGPT/Perplexity feel.
 */
export function StreamingText({
  text,
  speed = 18,
  onDone,
}: {
  text: string
  speed?: number
  onDone?: () => void
}) {
  const [shown, setShown] = React.useState("")
  const doneRef = React.useRef(onDone)
  doneRef.current = onDone

  React.useEffect(() => {
    setShown("")
    let i = 0
    const id = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        doneRef.current?.()
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  const streaming = shown.length < text.length

  return (
    <span>
      {shown}
      {streaming && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 rounded-full bg-primary align-middle"
          animate={ { opacity: [1, 0.2, 1] } }
          transition={ { duration: 0.8, repeat: Infinity } }
        />
      )}
    </span>
  )
}
