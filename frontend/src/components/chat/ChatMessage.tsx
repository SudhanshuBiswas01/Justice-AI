interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  
  if (role === "system") return null;

  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
          isUser 
            ? "bg-gradient-to-br from-cyan-600 to-cyan-500 text-white rounded-br-none shadow-lg shadow-cyan-500/20" 
            : "bg-white/10 text-zinc-100 rounded-bl-none border border-white/5 shadow-lg"
        }`}
      >
        {/* Render line breaks properly */}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {content}
        </div>
      </div>
    </div>
  );
}
