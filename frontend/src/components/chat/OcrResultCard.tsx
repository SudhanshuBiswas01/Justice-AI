"use client";

import { useState } from "react";

export interface DocumentMetadata {
  document_category: string;
  document_type: string;
  fine_amount?: string | null;
  challan_number?: string | null;
  date?: string | null;
  location?: string | null;
  vehicle_number?: string | null;
  offence_type?: string | null;
  merchant_name?: string | null;
  product_service?: string | null;
  summary?: string | null;
}

interface OcrResultCardProps {
  metadata: DocumentMetadata;
  rawText?: string;
  fileName?: string;
}

export function OcrResultCard({ metadata, rawText, fileName }: OcrResultCardProps) {
  const [showRaw, setShowRaw] = useState(false);

  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case "traffic_challan":
        return {
          label: "Traffic Challan",
          color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125v-3.07m-1.57 3.07a1.5 1.5 0 0 1-3-0m3 0h-12m17.25-4.5V9.75A3.375 3.375 0 0 0 16.5 6.375h-9.75A3.375 3.375 0 0 0 3.375 9.75v4.5m10.5-6v2.25a.75.75 0 0 0 .75.75h2.25" />
            </svg>
          )
        };
      case "mrp_overcharging":
        return {
          label: "MRP Overcharging",
          color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.317-4.317a1.5 1.5 0 0 0 0-2.122L11.159 4.659A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5Z" />
            </svg>
          )
        };
      case "refund":
        return {
          label: "Refund / Transaction dispute",
          color: "from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12a48.884 48.884 0 0 1 .138-3.662M3 12l-3 3m3-3l3 3M9 5.25h6" />
            </svg>
          )
        };
      case "consumer_dispute":
      default:
        return {
          label: "Consumer Dispute",
          color: "from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18L8 7m4-4l4 4m-4 14l-4-4m4 4l4-4" />
            </svg>
          )
        };
    }
  };

  const cat = getCategoryDetails(metadata.document_category);

  // Group fields to render them dynamically
  const fields = [
    { label: "Document Type", value: metadata.document_type, icon: "📄" },
    { label: "Fine/Total Amount", value: metadata.fine_amount, icon: "₹" },
    { label: "Challan/Order No.", value: metadata.challan_number, icon: "🔢" },
    { label: "Date", value: metadata.date, icon: "📅" },
    { label: "Location", value: metadata.location, icon: "📍" },
    { label: "Vehicle Number", value: metadata.vehicle_number, icon: "🚗" },
    { label: "Offence Type", value: metadata.offence_type, icon: "⚠️" },
    { label: "Merchant Name", value: metadata.merchant_name, icon: "🏢" },
    { label: "Product/Service", value: metadata.product_service, icon: "📦" }
  ].filter(f => f.value && f.value !== "null" && f.value !== "unknown");

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-white/15 my-3">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-violet-500/0 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r border ${cat.color}`}>
            {cat.icon}
            {cat.label}
          </div>
          {fileName && (
            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">
              {fileName}
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          OCR processed successfully
        </div>
      </div>

      {/* Summary */}
      {metadata.summary && (
        <p className="text-xs text-zinc-300 leading-relaxed mb-4 italic pl-3 border-l-2 border-cyan-500/50">
          "{metadata.summary}"
        </p>
      )}

      {/* Structured Fields Grid */}
      {fields.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {fields.map((field, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex items-center gap-3 transition-colors hover:bg-white/[0.03]">
              <span className="text-base shrink-0 p-1 bg-white/5 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-cyan-300">
                {field.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                  {field.label}
                </p>
                <p className="text-xs font-semibold text-white truncate max-w-full">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 mb-4">No structured metadata fields extracted.</p>
      )}

      {/* Raw Extracted Text Accordion */}
      {rawText && (
        <div className="border-t border-white/5 pt-3.5 mt-3">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-200 ${showRaw ? "rotate-90" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {showRaw ? "Hide Full Document Text" : "View Full Document Text"}
          </button>

          {showRaw && (
            <div className="mt-2.5 bg-black/40 rounded-xl p-3.5 border border-white/5 max-h-52 overflow-y-auto custom-scrollbar font-mono text-[10px] text-zinc-400 whitespace-pre-wrap leading-relaxed animate-fade-in select-text">
              {rawText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
