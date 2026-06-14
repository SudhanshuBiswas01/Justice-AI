"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Mail, Lock, User, Sparkles, Scale, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { AmbientBackground } from "@/components/shared/ambient-background"

// useSearchParams() requires a Suspense boundary in Next.js 14 App Router static builds.
// We split into an inner component and wrap in Suspense below.
import { VoiceOrb } from "@/components/voice/voice-orb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/shared/toast"
import { ease } from "@/lib/motion"

type Mode = "signin" | "signup"

function AuthInner() {
  const [mode, setMode] = React.useState<Mode>("signin")
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show NextAuth error if redirected back with ?error=
  React.useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      toast({
        tone: "error",
        title: "Authentication error",
        description: error === "CredentialsSignin" ? "Invalid email or password." : error,
      })
    }
  }, [searchParams, toast])

  async function handleGoogleSignIn() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      name,
      mode,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      toast({
        tone: "error",
        title: "Sign in failed",
        description: result.error,
      })
      return
    }

    toast({
      tone: "success",
      title: mode === "signin" ? "Welcome back" : "Account created",
      description: "Redirecting to your workspace…",
    })
    setTimeout(() => router.push("/dashboard"), 700)
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <AmbientBackground variant="intense" />

      {/* Left — cinematic brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex flex-col items-center justify-center gap-8">
          <VoiceOrb state="thinking" className="scale-90" />
          <div className="max-w-sm text-center">
            <h2 className="font-display text-3xl font-semibold leading-tight">
              Your AI legal copilot is{" "}
              <span className="text-gradient">ready.</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Chat, speak and analyze documents — grounded in verifiable
              sources, designed to feel effortless.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-300" /> SOC2-ready
          </span>
          <span className="flex items-center gap-2">
            <Scale className="size-4 text-primary" /> 2.4M+ sources
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" /> AI-first
          </span>
        </div>
      </div>

      {/* Right — auth card */}
      <div className="relative flex items-center justify-center p-6">
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease }}
          className="glass-strong w-full max-w-md rounded-3xl p-8 shadow-glass"
        >
          {/* Mode toggle */}
          <div className="relative mb-8 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <motion.div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-brand-gradient shadow-glow"
              animate={{ x: mode === "signin" ? 4 : "calc(100% + 4px)" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            />
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative z-10 rounded-full py-2 text-sm font-medium transition-colors ${
                  mode === m ? "text-white" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to continue to Justice AI."
                : "Start your free workspace in seconds."}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.03] py-3 text-sm font-medium transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Full name"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@firm.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Please wait…
                </span>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms &amp; Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams() needs it for static generation
export default function AuthPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthInner />
    </React.Suspense>
  )
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  )
}
