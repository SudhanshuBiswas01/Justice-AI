import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030308] text-white">
      <Navbar />
      <main className="flex-1 flex flex-col pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="py-8 flex flex-col h-[calc(100vh-4rem)]">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-white"><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Justice AI</span> Assistant</h1>
            <p className="text-zinc-400 mt-2">Describe your legal problem, and I&apos;ll identify the issue, assess your chances, and propose a strategy.</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/10">
            <ChatWindow />
          </div>
        </div>
      </main>
    </div>
  );
}
