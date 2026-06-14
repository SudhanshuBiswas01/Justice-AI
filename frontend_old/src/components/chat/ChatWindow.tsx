"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { FileUploadPreview } from "./FileUploadPreview";

interface Citation {
  ref: number;
  title: string;
  act_name: string;
  section: string;
  source: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  ocrResult?: any;
  fileName?: string;
  source_type?: "corpus" | "web_fallback" | "greeting";
  citations?: Citation[];
}

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am Justice AI. Please describe your legal problem in detail. I can help with traffic challans, consumer disputes, and overcharging issues."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── OCR & Attachment States ────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "uploading" | "ready" | "error">("idle");
  const [ocrErrorMessage, setOcrErrorMessage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      setFileName(selectedFile.name);
      setFileSize(selectedFile.size);
      setOcrStatus("error");
      setOcrErrorMessage("Unsupported file type. Only PDF and images (JPG, PNG, WEBP) are supported.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);
    setOcrStatus("uploading");
    setOcrErrorMessage(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to extract text from document.");
      }

      const data = await response.json();
      setOcrResult(data);
      setOcrStatus("ready");
    } catch (err: any) {
      console.error("OCR Extraction Error:", err);
      setOcrStatus("error");
      setOcrErrorMessage(err.message || "An unexpected error occurred during OCR extraction.");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setFileSize(0);
    setOcrStatus("idle");
    setOcrErrorMessage(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, elapsed]);

  // Live timer that ticks every 100ms while loading
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasOcr = ocrStatus === "ready" && ocrResult;
    if ((!input.trim() && !hasOcr) || isLoading || ocrStatus === "uploading") return;

    // Display clean query in UI bubble, or describe the file analyzed
    const queryText = input.trim() || `Analyze my uploaded ${ocrResult?.metadata?.document_type || "document"}`;

    const userMessage: Message = {
      role: "user",
      content: queryText,
      ocrResult: hasOcr ? ocrResult : undefined,
      fileName: hasOcr ? fileName : undefined
    };
    
    // Construct content with injected context to feed to RAG/LLM backend
    let backendContent = queryText;
    if (hasOcr) {
      const meta = ocrResult.metadata;
      backendContent = `${queryText}\n\n[Extracted Document Context]\nDocument Category: ${meta.document_category || "N/A"}\nDocument Type: ${meta.document_type || "N/A"}\nAmount: ${meta.fine_amount || "N/A"}\nChallan/Order Number: ${meta.challan_number || "N/A"}\nDate: ${meta.date || "N/A"}\nLocation: ${meta.location || "N/A"}\nVehicle Number: ${meta.vehicle_number || "N/A"}\nOffence/Violation: ${meta.offence_type || "N/A"}\nMerchant/Company: ${meta.merchant_name || "N/A"}\nProduct/Service: ${meta.product_service || "N/A"}\nSummary: ${meta.summary || "N/A"}\n\nRaw Extracted Document Text:\n${ocrResult.extracted_text}`;
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setLastLatency(null);

    // Clear file selection state
    setFile(null);
    setFileName("");
    setFileSize(0);
    setOcrStatus("idle");
    setOcrErrorMessage(null);
    setOcrResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      // Map existing messages correctly: for past messages that had ocrResult,
      // map their content to the backend text representation.
      const backendMessages = messages.map(m => ({
        role: m.role,
        content: m.ocrResult
          ? `${m.content}\n\n[Extracted Document Context]\nCategory: ${m.ocrResult.metadata.document_category}\nType: ${m.ocrResult.metadata.document_type}\nAmount: ${m.ocrResult.metadata.fine_amount || "N/A"}\nDate: ${m.ocrResult.metadata.date || "N/A"}\nLocation: ${m.ocrResult.metadata.location || "N/A"}\nVehicle: ${m.ocrResult.metadata.vehicle_number || "N/A"}\nOffence: ${m.ocrResult.metadata.offence_type || "N/A"}\nMerchant: ${m.ocrResult.metadata.merchant_name || "N/A"}\n\nRaw text:\n${m.ocrResult.extracted_text}`
          : m.content
      }));
      backendMessages.push({ role: "user", content: backendContent });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: backendMessages }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const detail = errData?.error || errData?.detail || `Server error (HTTP ${response.status})`;
        throw new Error(detail);
      }

      const finalLatency = (Date.now() - startTimeRef.current) / 1000;
      setLastLatency(finalLatency);

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          source_type: data.source_type ?? "corpus",
          citations: data.citations ?? [],
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      const finalLatency = (Date.now() - startTimeRef.current) / 1000;
      setLastLatency(finalLatency);
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: "Sorry, I encountered an error connecting to the server. Please make sure the backend is running and the API key is configured." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (secs: number) => {
    if (secs < 60) return `${secs.toFixed(1)}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs.toFixed(0)}s`;
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#030308]/50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Glassmorphic Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#030308]/85 backdrop-blur-md border-2 border-dashed border-cyan-500/40 rounded-2xl z-50 flex flex-col items-center justify-center gap-4 text-center p-6 transition-all animate-fade-in pointer-events-none">
          <div className="p-5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Drop your legal document</h3>
            <p className="text-sm text-zinc-400 max-w-sm mt-1">
              Drop your Challan, Receipt, Bill, Invoice or PDF here to automatically extract and analyze text & details.
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index}>
            <ChatMessage
              role={msg.role}
              content={msg.content}
              ocrResult={msg.ocrResult}
              fileName={msg.fileName}
            />

            {/* Source badge + citations (assistant messages only) */}
            {msg.role === "assistant" && msg.source_type && msg.source_type !== "greeting" && (
              <div className="flex flex-col gap-2 mb-4 -mt-3 ml-1 max-w-[85%]">
                {/* Source type pill */}
                {msg.source_type === "web_fallback" ? (
                  <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-6.75a.75.75 0 0 0-1.5 0v2a.75.75 0 0 0 1.5 0v-2ZM8 5.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
                    </svg>
                    ⚠️ No corpus match — answer from general LLM knowledge. Verify independently.
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-cyan-500/25 bg-cyan-500/8 px-2.5 py-0.5 text-[11px] font-medium text-cyan-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.78-4.22a.75.75 0 0 0-1.06-1.06L7.5 12.94 5.28 10.72a.75.75 0 0 0-1.06 1.06l2.75 2.75a.75.75 0 0 0 1.06 0l3.75-3.75Z" clipRule="evenodd" />
                    </svg>
                    Sourced from Indian law corpus
                  </div>
                )}

                {/* Citation list */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {msg.citations.map((c) => (
                      <div
                        key={c.ref}
                        className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-white/6 bg-white/3 px-3 py-1.5 text-[11px] text-zinc-400"
                      >
                        <span className="font-semibold text-zinc-300">[{c.ref}]</span>
                        {c.act_name && (
                          <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                            {c.act_name}
                          </span>
                        )}
                        {c.section && (
                          <span className="rounded bg-cyan-500/12 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
                            § {c.section}
                          </span>
                        )}
                        <span className="truncate text-zinc-500">{c.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Latency badge after last assistant message */}
            {!isLoading && lastLatency !== null && index === messages.length - 1 && msg.role === "assistant" && (
              <div className="flex justify-start mb-4 -mt-1 ml-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-zinc-600">
                    <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25a.75.75 0 0 0-1.5 0v3.5c0 .199.079.39.22.53l2 2a.75.75 0 1 0 1.06-1.06l-1.78-1.78V4.75Z" clipRule="evenodd" />
                  </svg>
                  {formatTime(lastLatency)}
                </span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex w-full mb-6 justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-none px-5 py-4 bg-white/5 border border-white/5 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></div>
              </div>
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-[#030308]/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 max-w-4xl mx-auto">
          {/* File Upload Preview */}
          {ocrStatus !== "idle" && (
            <FileUploadPreview
              fileName={fileName}
              fileSize={fileSize}
              status={ocrStatus}
              errorMessage={ocrErrorMessage}
              onRemove={handleRemoveFile}
              metadata={ocrResult?.metadata}
            />
          )}

          <div className="flex items-end gap-2 w-full">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />

            {/* Paperclip/Attachment Button */}
            <button
              type="button"
              disabled={isLoading || ocrStatus === "uploading"}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-cyan-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Upload legal document (Challan, Bill, Receipt, PDF)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>

            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your legal issue or upload a document..."
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 min-h-[52px] max-h-32 overflow-y-auto custom-scrollbar"
                rows={1}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || ocrStatus === "uploading" || (!input.trim() && ocrStatus !== "ready")}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] text-zinc-500 mt-2">
          Justice AI can make mistakes. Consider verifying important legal information.
        </p>
      </div>
    </div>
  );

}
