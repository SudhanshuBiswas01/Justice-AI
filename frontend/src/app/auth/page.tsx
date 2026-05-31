"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

/* ── Google SVG ───────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.46 3.19 29.54 1 24 1 14.82 1 7.07 6.48 3.61 14.24l7.1 5.52C12.38 13.16 17.73 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.54 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.69c-.55 2.94-2.2 5.43-4.69 7.1l7.27 5.65C43.44 37.27 46.54 31.32 46.54 24.5z" />
      <path fill="#FBBC05" d="M10.71 28.24A14.55 14.55 0 0 1 9.5 24c0-1.48.25-2.91.71-4.24l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.87.93 7.52 2.61 10.76l8.1-6.52z" />
      <path fill="#34A853" d="M24 47c5.54 0 10.19-1.84 13.58-4.99l-7.27-5.65c-1.84 1.24-4.2 1.96-6.31 1.96-6.27 0-11.62-3.66-13.29-9.26l-8.1 6.52C7.07 41.52 14.82 47 24 47z" />
    </svg>
  );
}

/* ── Spinner ──────────────────────────────────────────────── */
function Spinner({ small = false }: { small?: boolean }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-white/20 border-t-white ${small ? "h-4 w-4" : "h-5 w-5"}`} />
  );
}

/* ── Main component ───────────────────────────────────────── */
function AuthPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show server error from NextAuth redirect
  const urlError = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/app");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030308]">
        <Spinner />
      </div>
    );
  }

  /* ── Credentials submit ─────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      name,
      mode: tab,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.ok) {
      router.replace("/app");
    }
  };

  /* ── Google sign-in ─────────────────────────────────────── */
  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/app" });
  };

  const errorMsg = error || (urlError === "OAuthAccountNotLinked"
    ? "This email is already registered. Use email/password to sign in."
    : urlError
      ? "Authentication failed. Please try again."
      : "");

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#030308]">
      {/* ── Left panel — branding ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-start justify-between p-14 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[130px]" />
          <div className="absolute bottom-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/15 blur-[100px]" />
          <div className="absolute inset-0 grid-bg opacity-30" />
        </div>

        <a href="/" className="relative z-10">
          <span className="text-2xl font-bold tracking-tight text-gradient">Justice AI</span>
        </a>

        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            V1.0 · RAG-Powered Legal Assistant
          </div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            AI-Powered Legal<br />
            <span className="text-gradient">Guidance for India</span>
          </h2>
          <p className="mt-4 max-w-sm text-base text-zinc-500 leading-relaxed">
            Resolve traffic challans, MRP disputes, and consumer grievances with law-backed strategy — powered by RAG, OCR, and ML.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {["Traffic Challans", "MRP Disputes", "Consumer Rights", "RAG + OCR", "Instant Strategy"].map(f => (
              <span key={f} className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-zinc-400">
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-700">© 2026 Justice AI · For informational purposes only</p>
      </div>

      {/* ── Right panel — auth form ────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <a href="/" className="mb-8 lg:hidden">
          <span className="text-2xl font-bold tracking-tight text-gradient">Justice AI</span>
        </a>

        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="mb-8 flex rounded-xl bg-white/5 p-1 ring-1 ring-white/8">
            <button
              id="tab-login"
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "login"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                tab === "signup"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {tab === "login"
                ? "Sign in to continue to Justice AI"
                : "Get started with Justice AI for free"}
            </p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
                <input
                  id="input-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sudhanshu Biswas"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <input
                id="input-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Spinner small /> : null}
              {loading ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Google */}
          <button
            id="google-btn"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/8 active:scale-[0.98] disabled:opacity-60"
          >
            {googleLoading ? <Spinner small /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-zinc-600 leading-relaxed">
            By continuing you agree that Justice AI provides informational assistance only and is not a substitute for legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#030308]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </div>
    }>
      <AuthPageInner />
    </Suspense>
  );
}
