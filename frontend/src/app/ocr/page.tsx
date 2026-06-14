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
  const [extractedData, setExtractedData] = React.useState<any | null>(null)
  const { toast } = useToast()

  async function addFiles(files: { name: string; size: string; rawFile?: File }[]) {
    const items: DocItem[] = files.map((f) => ({
      id: `doc-${counter++}`,
      name: f.name,
      size: f.size,
      status: "uploading",
      progress: 10,
    }))
    setDocs((d) => [...items, ...d])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const rawFile = files[i]?.rawFile

      // Animate upload progress
      let progress = 10
      const upInterval = setInterval(() => {
        progress = Math.min(progress + 15, 85)
        setDocs((d) => d.map((x) => x.id === item.id ? { ...x, progress } : x))
      }, 200)

      // Mark as scanning
      setTimeout(() => {
        clearInterval(upInterval)
        setDocs((d) => d.map((x) => x.id === item.id ? { ...x, status: "scanning", progress: 85 } : x))
      }, 1200)

      // Real OCR call
      try {
        let result: any = null
        if (rawFile) {
          const formData = new FormData()
          formData.append("file", rawFile)
          const res = await fetch("/api/ocr", { method: "POST", body: formData })
          if (res.ok) result = await res.json()
        }

        setDocs((d) => d.map((x) => x.id === item.id ? { ...x, status: "done", progress: 100 } : x))

        if (result) {
          setExtractedData(result)
          toast({
            tone: "success",
            title: "Document analyzed",
            description: `${result.metadata?.document_type || "Document"} extracted successfully.`,
          })
        } else {
          toast({ tone: "success", title: "Document analyzed", description: "Ready to review." })
        }
      } catch (err: any) {
        setDocs((d) => d.map((x) => x.id === item.id ? { ...x, status: "done", progress: 100 } : x))
        toast({ tone: "error", title: "OCR failed", description: err.message })
      }
    }
  }

  const analyzed = docs.filter((d) => d.status === "done").length
  const meta = extractedData?.metadata

  return (
    <AppShell title="Document Intelligence" showSearch={false}>
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-3xl font-semibold">
            Scan &amp; understand any document
          </h2>
          <p className="text-muted-foreground">
            Drop a challan, bill, receipt or PDF and watch Justice AI extract,
            structure and explain every key detail in real time.
          </p>
        </div>

        <UploadZone onFiles={addFiles} />

        <AnimatePresence>
          {docs.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Documents</h3>
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

        {/* Real extracted data */}
        {meta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              <h3 className="font-display text-lg font-semibold">Extracted Details</h3>
            </div>
            <div className="space-y-3">
              {[
                meta.document_type    && `Document type: ${meta.document_type}`,
                meta.document_category && `Category: ${meta.document_category}`,
                meta.fine_amount      && `Amount: ${meta.fine_amount}`,
                meta.challan_number   && `Challan / Order No.: ${meta.challan_number}`,
                meta.date             && `Date: ${meta.date}`,
                meta.location         && `Location: ${meta.location}`,
                meta.vehicle_number   && `Vehicle: ${meta.vehicle_number}`,
                meta.offence_type     && `Offence: ${meta.offence_type}`,
                meta.merchant_name    && `Merchant: ${meta.merchant_name}`,
                meta.product_service  && `Product/Service: ${meta.product_service}`,
                meta.summary          && `Summary: ${meta.summary}`,
              ]
                .filter(Boolean)
                .map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
                  >
                    <FileText className="size-4 shrink-0 text-primary" />
                    {line}
                  </motion.div>
                ))}
            </div>

            {extractedData?.extracted_text && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Show raw extracted text
                </summary>
                <pre className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-3 text-[11px] leading-relaxed text-foreground/70 whitespace-pre-wrap">
                  {extractedData.extracted_text}
                </pre>
              </details>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
