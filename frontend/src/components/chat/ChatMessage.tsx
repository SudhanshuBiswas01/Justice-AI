"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { OcrResultCard } from "./OcrResultCard";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  ocrResult?: any;
  fileName?: string;
}

export function ChatMessage({ role, content, ocrResult, fileName }: ChatMessageProps) {
  const isUser = role === "user";
  
  if (role === "system") return null;

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? "items-end" : "items-start"}`}>
      {/* OCR Result Card rendered inline above the message bubble for users */}
      {isUser && ocrResult && (
        <div className="max-w-[85%] sm:max-w-[75%] w-full mb-2">
          <OcrResultCard
            metadata={ocrResult.metadata}
            rawText={ocrResult.extracted_text}
            fileName={fileName}
          />
        </div>
      )}
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser 
            ? "bg-gradient-to-br from-cyan-600 to-cyan-500 text-white rounded-br-none shadow-lg shadow-cyan-500/20" 
            : "bg-white/10 text-zinc-100 rounded-bl-none border border-white/5 shadow-lg"
        }`}
      >
        {isUser ? (
          <div className="text-sm leading-relaxed font-sans whitespace-pre-wrap">
            {content}
          </div>
        ) : (
          <div className="ai-message text-sm leading-relaxed font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-cyan-300 mt-4 mb-2 pb-1.5 border-b border-cyan-500/20 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-cyan-300 mt-4 mb-2 pb-1 border-b border-cyan-500/15 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-cyan-200 mt-3 mb-1.5 first:mt-0">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold text-violet-300 mt-2.5 mb-1 first:mt-0">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-2.5 last:mb-0 text-zinc-200 leading-relaxed">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-zinc-300">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 ml-1 space-y-1.5 list-none">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 ml-1 space-y-1.5 list-none counter-reset-item">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-zinc-200">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-violet-400/50 pl-3 my-2.5 text-zinc-300 italic bg-violet-500/5 py-1.5 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <code className="block bg-black/30 rounded-lg p-3 my-2 text-xs text-cyan-200 overflow-x-auto border border-white/5 font-mono">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="bg-white/10 text-cyan-200 px-1.5 py-0.5 rounded text-xs font-mono border border-white/5">
                      {children}
                    </code>
                  );
                },
                hr: () => (
                  <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                ),
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" 
                     className="text-cyan-400 underline underline-offset-2 decoration-cyan-400/40 hover:decoration-cyan-400 transition-colors">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-white/10">
                    <table className="w-full text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-white/5 text-cyan-300 font-semibold">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-white/5">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-white/5 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-zinc-300">{children}</td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
