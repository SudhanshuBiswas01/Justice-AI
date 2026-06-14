"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UploadCloud, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export function UploadZone({
  onFiles,
}: {
  onFiles: (files: { name: string; size: string; rawFile: File }[]) => void
}) {
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function mapFiles(rawFiles: File[]) {
    return rawFiles.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      rawFile: f,
    }))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = mapFiles(Array.from(e.dataTransfer.files))
    if (dropped.length) onFiles(dropped)
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = mapFiles(Array.from(e.target.files ?? []))
    if (picked.length) onFiles(picked)
  }

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{ scale: dragging ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition-colors duration-300",
        dragging
          ? "border-primary/70 bg-primary/[0.06]"
          : "border-white/15 bg-white/[0.02] hover:border-white/30",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handlePick}
      />

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-grid opacity-30"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={dragging ? { y: [-4, 4, -4] } : { y: [0, -8, 0] }}
        transition={{ duration: dragging ? 0.8 : 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid size-20 place-items-center rounded-2xl bg-brand-gradient shadow-glow"
      >
        <UploadCloud className="size-9 text-white" />
        <motion.div
          className="absolute -right-3 -top-3 grid size-9 place-items-center rounded-xl border border-white/10 bg-card"
          animate={{ rotate: [0, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <FileText className="size-4 text-accent" />
        </motion.div>
      </motion.div>

      <h3 className="mt-6 font-display text-xl font-semibold">
        {dragging ? "Release to upload" : "Drop documents to analyze"}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Drag &amp; drop challans, bills, receipts or PDFs — or click to browse.
        PDF, PNG, JPG, WEBP supported.
      </p>
    </motion.div>
  )
}
