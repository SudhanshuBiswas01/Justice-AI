import React from "react";

interface VoiceOrbProps {
  state: "idle" | "listening" | "processing" | "speaking";
}

export function VoiceOrb({ state }: VoiceOrbProps) {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto select-none">
      {/* Concentric ripples for listening state */}
      {state === "listening" && (
        <>
          <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ripple" style={{ animationDelay: "0s" }}></div>
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ripple" style={{ animationDelay: "0.66s" }}></div>
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ripple" style={{ animationDelay: "1.33s" }}></div>
        </>
      )}

      {/* Rotating outer ring for processing state */}
      {state === "processing" && (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/25 animate-spin-slow"></div>
      )}

      {/* Main Glassmorphic Orb Body */}
      <div
        className={`w-40 h-40 rounded-full flex items-center justify-center relative transition-all duration-700 overflow-hidden ${
          state === "idle"
            ? "bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/10 border border-violet-500/20 animate-orb-pulse"
            : state === "listening"
            ? "bg-gradient-to-tr from-cyan-600/40 to-emerald-600/15 border border-cyan-400/40 scale-105 shadow-[0_0_50px_rgba(6,182,212,0.35)]"
            : state === "processing"
            ? "bg-gradient-to-tr from-cyan-600/30 to-violet-600/30 border border-violet-400/30 scale-95 shadow-[0_0_40px_rgba(167,139,250,0.2)] animate-pulse"
            : "bg-gradient-to-tr from-violet-600/40 to-cyan-600/15 border border-violet-400/40 scale-105 shadow-[0_0_50px_rgba(139,92,246,0.35)]"
        }`}
      >
        {/* Inner glass effect overlays */}
        <div className="absolute inset-2 rounded-full bg-white/5 backdrop-blur-md"></div>
        <div className="absolute inset-[15%] rounded-full bg-gradient-to-b from-white/10 to-transparent"></div>

        {/* State Indicators inside the Orb */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {state === "idle" && (
            <div className="text-zinc-400 hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>
          )}

          {state === "listening" && (
            <div className="text-cyan-400 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            </div>
          )}

          {state === "processing" && (
            <div className="text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 animate-spin">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
          )}

          {state === "speaking" && (
            <div className="flex items-end gap-1 h-8 w-12 justify-center">
              <div className="w-1 bg-violet-400 rounded-full animate-wave-bar" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-1 bg-cyan-400 rounded-full animate-wave-bar" style={{ animationDelay: "0.3s" }}></div>
              <div className="w-1 bg-fuchsia-400 rounded-full animate-wave-bar" style={{ animationDelay: "0.0s" }}></div>
              <div className="w-1 bg-violet-400 rounded-full animate-wave-bar" style={{ animationDelay: "0.4s" }}></div>
              <div className="w-1 bg-cyan-400 rounded-full animate-wave-bar" style={{ animationDelay: "0.2s" }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
