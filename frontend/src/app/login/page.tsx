"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/chat");
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/chat" });
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030308]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-sm text-zinc-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030308] px-6">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-cyan-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[110px]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <a href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tight text-gradient">
              Justice AI
            </span>
          </a>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-widest text-cyan-300/80 uppercase backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            V1.0 — RAG-Powered Legal Assistant
          </p>
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl shadow-black/60">
          <h1 className="mb-1 text-xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="mb-8 text-sm text-zinc-500">
            Sign in to access your legal assistant
          </p>

          {/* Google button */}
          <button
            id="google-sign-in-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-zinc-200 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              /* Google SVG icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="h-5 w-5 shrink-0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.46 3.19 29.54 1 24 1 14.82 1 7.07 6.48 3.61 14.24l7.1 5.52C12.38 13.16 17.73 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.54 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.69c-.55 2.94-2.2 5.43-4.69 7.1l7.27 5.65C43.44 37.27 46.54 31.32 46.54 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.71 28.24A14.55 14.55 0 0 1 9.5 24c0-1.48.25-2.91.71-4.24l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.87.93 7.52 2.61 10.76l8.1-6.52z"
                />
                <path
                  fill="#34A853"
                  d="M24 47c5.54 0 10.19-1.84 13.58-4.99l-7.27-5.65c-1.84 1.24-4.2 1.96-6.31 1.96-6.27 0-11.62-3.66-13.29-9.26l-8.1 6.52C7.07 41.52 14.82 47 24 47z"
                />
              </svg>
            )}
            {isLoading ? "Signing in…" : "Continue with Google"}
          </button>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
            By continuing, you agree to use Justice AI for informational
            purposes only. This is not legal advice.
          </p>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-xs text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">
            ← Back to homepage
          </a>
        </p>
      </div>
    </div>
  );
}
