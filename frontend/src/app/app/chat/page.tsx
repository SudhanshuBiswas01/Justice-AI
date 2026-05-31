import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import Link from "next/link";

export const metadata = {
  title: "Justice AI — Legal Assistant Chat",
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  traffic:  { label: "Traffic Challan",   icon: "🚦" },
  mrp:      { label: "MRP Overcharging",  icon: "🏷️" },
  refund:   { label: "Refund Dispute",    icon: "💳" },
  general:  { label: "General Advice",    icon: "⚖️" },
};

export default async function AppChatPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");

  const params = await searchParams;
  const cat = params.category && categoryLabels[params.category]
    ? params.category
    : null;
  const catMeta = cat ? categoryLabels[cat] : null;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030308] text-white">
      <Navbar />

      <main className="flex-1 flex flex-col pt-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="py-6 flex flex-col h-[calc(100vh-4rem)]">

          {/* Header row */}
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/15 hover:text-zinc-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              Dashboard
            </Link>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2">
              {catMeta ? (
                <>
                  <span className="text-base">{catMeta.icon}</span>
                  <span className="text-sm font-medium text-white">{catMeta.label}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-cyan-400">
                    <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                  </svg>
                  <span className="text-sm font-medium text-white">AI Legal Assistant</span>
                </>
              )}
            </div>
          </div>

          {/* Chat container */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/5">
            <ChatWindow />
          </div>

        </div>
      </main>
    </div>
  );
}
