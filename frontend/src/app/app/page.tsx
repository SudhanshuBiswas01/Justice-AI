import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Justice AI — Dashboard",
};

const categories = [
  {
    id: "traffic",
    icon: "🚦",
    title: "Traffic Challan",
    description: "Fight wrong fines. Analyse your challan, check validity, and get a step-by-step dispute strategy.",
    color: "from-cyan-500/20 to-cyan-400/5",
    border: "hover:border-cyan-400/40",
    glow: "group-hover:shadow-cyan-500/10",
    badge: "Traffic",
    badgeColor: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  },
  {
    id: "mrp",
    icon: "🏷️",
    title: "MRP Overcharging",
    description: "Charged above MRP? Identify violations under the Legal Metrology Act and file a complaint.",
    color: "from-violet-500/20 to-violet-400/5",
    border: "hover:border-violet-400/40",
    glow: "group-hover:shadow-violet-500/10",
    badge: "Consumer",
    badgeColor: "bg-violet-400/10 text-violet-300 border-violet-400/20",
  },
  {
    id: "refund",
    icon: "💳",
    title: "Refund Dispute",
    description: "Get your money back. Know your rights under the Consumer Protection Act for e-commerce and bookings.",
    color: "from-amber-500/20 to-amber-400/5",
    border: "hover:border-amber-400/40",
    glow: "group-hover:shadow-amber-500/10",
    badge: "Refund",
    badgeColor: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  },
  {
    id: "general",
    icon: "⚖️",
    title: "General Advice",
    description: "Any other consumer or civil grievance? Describe your problem and get law-backed guidance.",
    color: "from-rose-500/20 to-rose-400/5",
    border: "hover:border-rose-400/40",
    glow: "group-hover:shadow-rose-500/10",
    badge: "General",
    badgeColor: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  },
];

export default async function AppDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");

  const firstName = session.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="relative min-h-screen flex flex-col bg-[#030308] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none fixed top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[110px]" />

      <Navbar />

      <main className="relative z-10 flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Welcome header */}
          <div className="mb-12">
            <p className="mb-2 text-sm text-zinc-500 font-medium tracking-wide">
              Welcome back,
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-gradient">{firstName}</span>
              <span className="text-white"> — what can we help with?</span>
            </h1>
            <p className="mt-3 text-zinc-500 max-w-lg text-sm leading-relaxed">
              Select a category below to get law-backed guidance, or jump straight into the AI assistant.
            </p>
          </div>

          {/* Category cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-10">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/app/chat?category=${cat.id}`}
                className={`group relative rounded-2xl border border-white/8 bg-gradient-to-br ${cat.color} p-6 transition-all duration-300 ${cat.border} hover:shadow-xl ${cat.glow} cursor-pointer`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>
                <h2 className="mb-2 text-base font-semibold text-white group-hover:text-white">
                  {cat.title}
                </h2>
                <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                  {cat.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  Start consultation
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick-start CTA */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Not sure where to start?</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Describe your problem in plain language — our AI will identify the issue and guide you.
              </p>
            </div>
            <Link
              href="/app/chat"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
              Open AI Assistant
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
