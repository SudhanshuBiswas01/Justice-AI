import type { Metadata } from "next"
import { Inter, Sora, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/shared/toast"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Justice AI — Your AI Legal Intelligence",
  description:
    "Justice AI is an AI-first legal intelligence platform — conversational counsel, Nyay Voice AI, and document intelligence in one cinematic experience.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${mono.variable} min-h-screen antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
