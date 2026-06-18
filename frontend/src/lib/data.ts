import {
  MessageSquareText,
  Mic,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Scale,
  FileSearch,
  Gavel,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react"

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
  accent: string
}

export const features: Feature[] = [
  {
    icon: MessageSquareText,
    title: "Conversational Counsel",
    description:
      "Ask anything in plain language. Justice AI reasons across statutes, precedent and your documents in real time.",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    icon: Mic,
    title: "Nyay Voice AI",
    description:
      "Speak naturally and get spoken legal guidance. A cinematic voice orb listens, thinks and responds live.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: ScanLine,
    title: "Document Intelligence",
    description:
      "Drag in contracts, notices or judgments. Our OCR engine extracts, structures and explains every clause.",
    accent: "from-cyan-400 to-sky-500",
  },
  {
    icon: ShieldCheck,
    title: "Source Transparency",
    description:
      "Every answer is grounded with citations and verifiable sources — no hallucinations, full auditability.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    icon: Scale,
    title: "Case Workspaces",
    description:
      "Organize matters, parties and timelines in elegant case cards that stay perfectly in sync.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: Sparkles,
    title: "Drafting Studio",
    description:
      "Generate notices, agreements and briefs with on-brand structure and one-click refinement.",
    accent: "from-pink-500 to-rose-500",
  },
]

export const stats = [
  { value: "2.4M+", label: "Statutes & precedents indexed" },
  { value: "99.2%", label: "Citation accuracy" },
  { value: "18s", label: "Avg. document analysis" },
  { value: "24/7", label: "Always-on legal copilot" },
]

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const dashboardNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: Gavel },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
  { label: "Deep Research", href: "/deep-research", icon: BrainCircuit },
  { label: "Nyay Voice", href: "/voice", icon: Mic },
  { label: "Documents", href: "/ocr", icon: FileSearch },
]

export type CaseRecord = {
  id: string
  title: string
  client: string
  type: string
  status: "Active" | "Review" | "Filed" | "Closed"
  progress: number
  updated: string
}

export const cases: CaseRecord[] = [
  {
    id: "JA-2041",
    title: "Mehta v. Skyline Developers",
    client: "Aarav Mehta",
    type: "Property Dispute",
    status: "Active",
    progress: 72,
    updated: "2h ago",
  },
  {
    id: "JA-2038",
    title: "Trademark Opposition — Lumen",
    client: "Lumen Studios",
    type: "IP / Trademark",
    status: "Review",
    progress: 45,
    updated: "Yesterday",
  },
  {
    id: "JA-2033",
    title: "Employment Settlement",
    client: "Priya Nair",
    type: "Labour Law",
    status: "Filed",
    progress: 90,
    updated: "3d ago",
  },
  {
    id: "JA-2027",
    title: "Vendor Agreement Review",
    client: "Northwind Pvt Ltd",
    type: "Contracts",
    status: "Active",
    progress: 33,
    updated: "5d ago",
  },
]
