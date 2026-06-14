"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Phone, Pause, Volume2 } from "lucide-react"
import { AppShell } from "@/components/shared/app-shell"
import { VoiceOrb, type VoiceState } from "@/components/voice/voice-orb"
import { Waveform } from "@/components/voice/waveform"
import { SourceBadge } from "@/components/shared/source-badge"
import { cn } from "@/lib/utils"

const stateCopy: Record<VoiceState, { label: string; sub: string }> = {
  idle:      { label: "Tap to start",          sub: "Nyay is ready when you are" },
  listening: { label: "Listening…",            sub: "Speak naturally" },
  thinking:  { label: "Thinking…",             sub: "Reasoning across legal sources" },
  speaking:  { label: "Nyay is speaking",      sub: "Grounded in verified Indian law" },
}

interface TranscriptEntry {
  role: "user" | "nyay"
  text: string
  source_type?: "corpus" | "web_fallback" | "greeting"
}

// Browser SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number
  start(): void; stop(): void; abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null
  onend:    (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

export default function VoicePage() {
  const [voiceState, setVoiceState] = React.useState<VoiceState>("idle")
  const [active, setActive] = React.useState(false)
  const [language, setLanguage] = React.useState<"en-IN" | "hi-IN">("en-IN")
  const [transcript, setTranscript] = React.useState<TranscriptEntry[]>([])
  const [interimText, setInterimText] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const recognitionRef   = React.useRef<SpeechRecognitionInstance | null>(null)
  const currentAudioRef  = React.useRef<HTMLAudioElement | null>(null)
  const finalTranscript  = React.useRef("")
  const messagesRef      = React.useRef<TranscriptEntry[]>([])
  const transcriptEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript, voiceState])

  React.useEffect(() => {
    messagesRef.current = transcript
  }, [transcript])

  async function processUserText(userText: string) {
    setVoiceState("thinking")
    setInterimText("")

    setTranscript((prev) => [...prev, { role: "user", text: userText }])

    try {
      const chatMessages = [
        ...messagesRef.current.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: userText },
      ]

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      })

      if (!chatRes.ok) throw new Error(`Chat failed (${chatRes.status})`)

      const chatData = await chatRes.json()
      const assistantText = chatData.response as string
      const sourceType    = chatData.source_type ?? "corpus"

      setTranscript((prev) => [...prev, { role: "nyay", text: assistantText, source_type: sourceType }])

      // TTS
      const ttsRes = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: assistantText, language }),
      })

      if (!ttsRes.ok) throw new Error("TTS failed")

      const audioBlob = await ttsRes.blob()
      const audioUrl  = URL.createObjectURL(audioBlob)
      const audio     = new Audio(audioUrl)
      currentAudioRef.current = audio

      setVoiceState("speaking")
      audio.onended = () => setVoiceState("idle")
      audio.onerror = () => { setVoiceState("idle"); setErrorMsg("Playback error.") }
      await audio.play()
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.")
      setVoiceState("idle")
    }
  }

  function startSession() {
    setErrorMsg(null)
    setActive(true)
    finalTranscript.current = ""

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg("Browser speech recognition not supported. Try Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ""
      let final   = ""
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) final += r[0].transcript + " "
        else interim += r[0].transcript
      }
      if (final) finalTranscript.current = final.trim()
      setInterimText(interim || finalTranscript.current)
    }

    recognition.onerror = (event) => {
      if (event.error === "no-speech") setErrorMsg("No speech detected.")
      else if (event.error === "not-allowed") setErrorMsg("Microphone access denied.")
      else setErrorMsg(`Speech error: ${event.error}`)
      setVoiceState("idle")
    }

    recognition.onend = () => {
      const text = finalTranscript.current.trim()
      if (text) processUserText(text)
      else setVoiceState("idle")
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState("listening")
  }

  function stopListening() {
    recognitionRef.current?.stop()
  }

  function endSession() {
    recognitionRef.current?.abort()
    currentAudioRef.current?.pause()
    currentAudioRef.current = null
    setActive(false)
    setVoiceState("idle")
  }

  const copy = stateCopy[voiceState]

  return (
    <AppShell title="Nyay Voice AI" showSearch={false}>
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
        {/* Ambient reactive glow */}
        <motion.div
          className="pointer-events-none absolute size-[36rem] rounded-full bg-primary/20 blur-3xl"
          animate={{
            scale: voiceState === "speaking" ? [1, 1.2, 1] : voiceState === "listening" ? [1, 1.1, 1] : 1,
            opacity: active ? 0.5 : 0.25,
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8">
          <VoiceOrb state={voiceState} />
          <Waveform state={voiceState} className="w-72" />

          <div className="flex flex-col items-center gap-1 text-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={copy.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="font-display text-2xl font-semibold"
              >
                {copy.label}
              </motion.h2>
            </AnimatePresence>
            <p className="text-sm text-muted-foreground">{copy.sub}</p>

            {voiceState === "listening" && interimText && (
              <p className="mt-2 max-w-xs rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs italic text-cyan-300">
                &ldquo;{interimText}&rdquo;
              </p>
            )}

            {voiceState === "speaking" && <SourceBadge count={3} className="mt-2" />}

            {/* Language toggle */}
            <div className="mt-4 flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {(["en-IN", "hi-IN"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  disabled={active}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                    language === lang
                      ? "bg-brand-gradient text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                  )}
                >
                  {lang === "en-IN" ? "🇬🇧 English (IN)" : "🇮🇳 Hindi / Hinglish"}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!active ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startSession}
                className="flex h-16 items-center gap-3 rounded-full bg-brand-gradient px-8 text-base font-medium text-white shadow-glow"
              >
                <Mic className="size-5" /> Start session
              </motion.button>
            ) : (
              <>
                <button
                  onClick={voiceState === "listening" ? stopListening : undefined}
                  disabled={voiceState !== "listening"}
                  className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-40"
                  title="Stop listening"
                >
                  <Pause className="size-5" />
                </button>
                <button
                  onClick={() => { currentAudioRef.current?.pause(); setVoiceState("idle") }}
                  disabled={voiceState !== "speaking"}
                  className="grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-40"
                  title="Stop playback"
                >
                  <Volume2 className="size-5" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endSession}
                  className="grid size-16 place-items-center rounded-full bg-rose-500 text-white shadow-[0_0_40px_-8px_rgba(244,63,94,0.7)]"
                  title="End session"
                >
                  <Phone className="size-6 rotate-[135deg]" />
                </motion.button>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="max-w-xs rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-center text-xs text-rose-400">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Live transcript */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="glass-strong absolute bottom-6 z-10 w-full max-w-lg rounded-2xl p-4"
            >
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                Live transcript
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {transcript.map((t, i) => (
                  <div key={i}>
                    <p className={cn("text-sm", t.role === "user" ? "text-foreground/80" : "text-foreground")}>
                      <span className={cn("mr-2 font-medium", t.role === "user" ? "text-muted-foreground" : "text-primary")}>
                        {t.role === "user" ? "You" : "Nyay"}
                      </span>
                      {t.text}
                    </p>
                    {t.role === "nyay" && t.source_type === "web_fallback" && (
                      <span className="ml-8 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                        ⚠️ General knowledge — verify independently
                      </span>
                    )}
                    {t.role === "nyay" && t.source_type === "corpus" && (
                      <span className="ml-8 inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                        ✓ Indian law corpus
                      </span>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
