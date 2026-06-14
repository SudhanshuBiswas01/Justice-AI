import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { VoiceSession } from "@/components/voice/VoiceSession";

export const metadata = {
  title: "Justice AI — Nyay Voice Assistant",
};

export default async function VoicePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030308] text-white">
      {/* Background Grid */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-20" />
      <div className="pointer-events-none fixed top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[110px]" />

      <Navbar />
      
      <main className="relative z-10 flex-1 flex flex-col pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            ⚖️ Nyay <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Voice AI</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl">
            Conversational legal assistance using real-time Indian accent speech processing and RAG retrieval.
          </p>
        </div>
        
        <VoiceSession />
      </main>
    </div>
  );
}
