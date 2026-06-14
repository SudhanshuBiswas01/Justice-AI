"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, FileText, ListChecks } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { UploadZone } from "@/components/ocr/upload-zone"
import { DocumentCard, type DocItem } from "@/components/ocr/document-card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/shared/toast"

let counter = 0

export default function OcrPage() {
  const [docs, setDocs] = React.useState<DocItem[]>([])
  const { toast } = useToast()

  function addFiles(files: { name: string; size: string }[]) {
    const items: DocItem[] = files.map((f) => ({
      id: `doc-${counter++}`,
      name: f.name,
      size: f.size,
      status: "uploading",
      progress: 8,
    }))
    setDocs((d) => [...items, ...d])
    items.forEach((item) => simulate(item.id))
  }

  function simulate(id: string) {
    // Upload phase
    const up = setInterval(() => {
      setDocs((d) =>
        d.map((x) =>
          x.id === id ? { ...x, progress: Math.min(x.progress + 14, 100) } : x,
        ),
      )
    }, 220)

    setTimeout(() => {
      clearInterval(up)
      setDocs((d) =>
        d.map((x) =>
          x.id === id ? { ...x, status: "scanning", progress: 35 } : x,
        ),
      )
      // Scan phase
      const scan = setInterval(() => {
        setDocs((d) =>
          d.map((x) =>
            x.id === id ? { ...x, progress: Math.min(x.progress + 9, 100) } : x,
          ),
        )
      }, 200)
      setTimeout(() => {
        clearInterval(scan)
        setDocs((d) =>
          d.map((x) =>
            x.id === id ? { ...x, status: "done", progress: 100 } : x,
          ),
        )
        toast({
          tone: "success",
          title: "Document analyzed",
          description: "Clauses extracted and ready to review.",
        })
      }, 1900)
    }, 1300)
  }

  const analyzed = docs.filter((d) => d.status === "done").length

  return (
    <AppShell title="Document Intelligence" showSearch={false}>
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-3xl font-semibold">
            Scan &amp; understand any document
          </h2>
          <p className="text-muted-foreground">
            Drop a file and watch Justice AI extract, structure and explain every
            clause in real time.
          </p>
        </div>

        <UploadZone onFiles={addFiles} />

        <AnimatePresence>
          {docs.length > 0 && (
            <motion.div
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">
                  Documents
                </h3>
                <Badge variant="primary">
                  <ListChecks className="size-3" /> {analyzed}/{docs.length} analyzed
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {docs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extracted insight preview */}
        {analyzed > 0 && (
          <motion.div
            initial={ { opacity: 0, y: 20 } }
            animate={ { opacity: 1, y: 0 } }
            className="glass-card overflow-hidden p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="font-display text-lg font-semibold">
                AI summary
              </h3>
            </div>
            <div className="space-y-3">
              {[
                "Agreement type: Commercial Lease (36 months)",
                "Notice period: 90 days — mutually binding",
                "Renewal: Auto-renew unless terminated in writing",
                "Risk flag: Penalty clause 4.2 favours lessor heavily",
              ].map((line, i) => (
                <motion.div
                  key={line}
                  initial={ { opacity: 0, x: -10 } }
                  animate={ { opacity: 1, x: 0 } }
                  transition={ { delay: i * 0.12 } }
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
                >
                  <FileText className="size-4 shrink-0 text-primary" />
                  {line}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
