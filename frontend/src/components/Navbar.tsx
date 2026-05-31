"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#030308]/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="text-lg font-bold tracking-tight">
          <span className="text-gradient">Justice AI</span>
        </a>

        {/* Nav links */}
        <div className="hidden items-center gap-8 text-sm text-zinc-500 sm:flex">
          <a href="/#categories" className="transition-colors hover:text-cyan-400">
            Categories
          </a>
          <a href="/#features" className="transition-colors hover:text-cyan-400">
            Features
          </a>
          <a href="/admin/scraper" className="transition-colors hover:text-cyan-400">
            Admin Scraper
          </a>
        </div>

        {/* Auth section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
          ) : session ? (
            /* Logged in — show avatar + sign out */
            <div className="flex items-center gap-3">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-cyan-400/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-xs font-bold text-white">
                  {session.user?.name?.[0] ?? "U"}
                </div>
              )}
              <span className="hidden text-sm text-zinc-300 sm:block">
                {session.user?.name?.split(" ")[0]}
              </span>
              <button
                id="sign-out-btn"
                onClick={() => signOut({ callbackUrl: "/auth" })}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Sign out
              </button>
            </div>
          ) : (
            /* Not logged in — show Sign In button */
            <Link
              id="sign-in-btn"
              href="/auth"
              className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-cyan-400/30"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
