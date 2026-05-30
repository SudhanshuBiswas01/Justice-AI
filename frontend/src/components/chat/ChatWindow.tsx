"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setLastLatency(null);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const finalLatency = (Date.now() - startTimeRef.current) / 1000;
      setLastLatency(finalLatency);

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
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
    <div className="flex flex-col h-full bg-[#030308]/50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index}>
            <ChatMessage role={msg.role} content={msg.content} />
            {/* Show latency badge after the last assistant message */}
            {!isLoading && lastLatency !== null && index === messages.length - 1 && msg.role === "assistant" && (
              <div className="flex justify-start mb-4 -mt-4 ml-1">
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
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your legal issue..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 min-h-[52px] max-h-32 overflow-y-auto custom-scrollbar"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-500 mt-2">
          Justice AI can make mistakes. Consider verifying important legal information.
        </p>
      </div>
    </div>
  );
}
