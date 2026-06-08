"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { VoiceOrb } from "./VoiceOrb";
import Link from "next/link";

// TypeScript declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function VoiceSession() {
  const [state, setState] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [language, setLanguage] = useState<"en-IN" | "hi-IN">("en-IN");
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef<string>("");

  // Check if browser supports Web Speech API
  const hasBrowserSTT = typeof window !== "undefined" && 
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // ── Fallback: MediaRecorder + backend STT (only used if browser API unavailable) ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-scroll transcripts to the bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // ── Process recognized text (shared by both STT methods) ──
  const processUserText = useCallback(async (userText: string) => {
    setState("processing");
    setInterimText("");
    try {
      // Add user message to transcript log
      setMessages((prev) => [...prev, { role: "user", content: userText }]);

      // Route transcribed query to existing RAG chat endpoint
      const chatMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userText },
      ];

      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!chatResponse.ok) {
        const errData = await chatResponse.json().catch(() => ({}));
        const detail = errData?.error || errData?.detail || `Chat failed (HTTP ${chatResponse.status})`;
        throw new Error(`Legal database error: ${detail}`);
      }

      const chatData = await chatResponse.json();
      const assistantText = chatData.response;

      // Add assistant response to transcript log
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);

      // Request Text-to-Speech (TTS) conversion
      const ttsResponse = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: assistantText, language }),
      });

      if (!ttsResponse.ok) {
        const errData = await ttsResponse.json().catch(() => ({}));
        const detail = errData?.error || errData?.detail || `TTS failed (HTTP ${ttsResponse.status})`;
        throw new Error(`Voice synthesis failed: ${detail}`);
      }

      const ttsBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(ttsBlob);

      // Play audio response
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      setState("speaking");
      audio.onended = () => {
        setState("idle");
      };
      audio.onerror = () => {
        setState("idle");
        setErrorMsg("Playback error occurred.");
      };

      await audio.play();
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during the voice request.";
      setErrorMsg(errMsg);
      setState("idle");
    }
  }, [messages, language]);

  // ── Primary: Browser Web Speech API ──
  const startBrowserRecognition = useCallback(() => {
    setErrorMsg(null);
    setInterimText("");
    finalTranscriptRef.current = "";

    // Stop any playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        finalTranscriptRef.current = final.trim();
      }
      setInterimText(interim || finalTranscriptRef.current);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[Web Speech API] Error:", event.error, event.message);
      if (event.error === "no-speech") {
        setErrorMsg("No speech detected — please speak more clearly and try again.");
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorMsg("Microphone access denied. Please allow microphone permissions in your browser.");
      } else if (event.error === "network") {
        setErrorMsg("Network error during speech recognition. Check your internet connection.");
      } else {
        setErrorMsg(`Speech recognition error: ${event.error}`);
      }
      setState("idle");
      setInterimText("");
    };

    recognition.onend = () => {
      const text = finalTranscriptRef.current.trim();
      if (text) {
        processUserText(text);
      } else {
        // Only show error if we're still in "listening" state (user didn't manually stop with no speech)
        setState((prev) => {
          if (prev === "listening") {
            setErrorMsg("No speech detected — please speak more clearly and try again.");
            return "idle";
          }
          return prev;
        });
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
  }, [language, processUserText]);

  const stopBrowserRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend handler will fire and process the transcript
    }
  }, []);

  // ── Fallback: MediaRecorder + Backend Google Cloud STT ──
  const startFallbackRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      let options = { mimeType: "audio/webm;codecs=opus" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/webm" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/ogg;codecs=opus" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "" };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 1000) {
          setErrorMsg("Recording too short. Hold the button and speak before releasing.");
          setState("idle");
          return;
        }

        await handleFallbackAudio(audioBlob);
      };

      mediaRecorder.start();
      setState("listening");
    } catch (err: unknown) {
      console.error("Error accessing microphone:", err);
      setErrorMsg("Microphone access denied. Please allow microphone permissions in your browser.");
      setState("idle");
    }
  };

  const stopFallbackRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFallbackAudio = async (audioBlob: Blob) => {
    setState("processing");
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const sttResponse = await fetch(`/api/voice/stt?language=${language}`, {
        method: "POST",
        body: formData,
      });

      if (!sttResponse.ok) {
        const errData = await sttResponse.json().catch(() => ({}));
        const detail = errData?.error || errData?.detail || `STT failed (HTTP ${sttResponse.status})`;
        throw new Error(`Speech recognition failed: ${detail}`);
      }

      const sttData = await sttResponse.json();
      const userText = sttData.transcript?.trim();

      if (!userText) {
        throw new Error("No speech detected — please speak more clearly and try again.");
      }

      await processUserText(userText);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during the voice request.";
      setErrorMsg(errMsg);
      setState("idle");
    }
  };

  // ── Unified start/stop that picks the right method ──
  const startRecording = () => {
    if (hasBrowserSTT) {
      startBrowserRecognition();
    } else {
      startFallbackRecording();
    }
  };

  const stopRecording = () => {
    if (hasBrowserSTT) {
      stopBrowserRecognition();
    } else {
      stopFallbackRecording();
    }
  };

  const stopPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setState("idle");
  };

  const clearSession = () => {
    stopPlayback();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setMessages([]);
    setErrorMsg(null);
    setInterimText("");
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-10rem)] max-w-6xl mx-auto w-full">
      {/* LEFT PANEL: Voice Controller UI */}
      <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden shadow-2xl">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />

        {/* Top bar controls */}
        <div className="w-full flex items-center justify-between relative z-10">
          <Link
            href="/app"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>

          {/* Premium Badge */}
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300">
            🎙️ Nyay Voice Premium
          </span>
        </div>

        {/* Central Orb Display */}
        <div className="my-6 relative z-10">
          <VoiceOrb state={state} />
          
          <div className="text-center mt-4">
            <h2 className="text-xl font-bold tracking-tight text-white capitalize">
              {state === "idle" && "Ready to Talk"}
              {state === "listening" && "Listening..."}
              {state === "processing" && "Analyzing Case..."}
              {state === "speaking" && "Speaking Legal Strategy"}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
              {state === "idle" && "Tap the microphone below and describe your consumer or traffic dispute."}
              {state === "listening" && "Speak clearly. Tap again to finish."}
              {state === "processing" && "Running vector search and grading legal documents..."}
              {state === "speaking" && "Playing Indian Law analysis. Tap stop button to interrupt."}
            </p>
          </div>

          {/* Live interim transcript while listening */}
          {state === "listening" && interimText && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 max-w-xs mx-auto">
              <p className="text-xs text-cyan-300 italic text-center">&ldquo;{interimText}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Lower Controls & Language Toggles */}
        <div className="w-full flex flex-col items-center gap-6 relative z-10">
          {/* Language Selector */}
          <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1 w-fit">
            <button
              onClick={() => setLanguage("en-IN")}
              disabled={state !== "idle"}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                language === "en-IN"
                  ? "bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white disabled:opacity-40"
              }`}
            >
              🇬🇧 English (IN)
            </button>
            <button
              onClick={() => setLanguage("hi-IN")}
              disabled={state !== "idle"}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                language === "hi-IN"
                  ? "bg-gradient-to-br from-cyan-500 to-violet-500 text-white shadow-md"
                  : "text-zinc-400 hover:text-white disabled:opacity-40"
              }`}
            >
              🇮🇳 Hindi / Hinglish
            </button>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-4">
            {state === "speaking" ? (
              <button
                onClick={stopPlayback}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95"
                title="Stop response voice playback"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={state === "listening" ? stopRecording : startRecording}
                disabled={state === "processing"}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-lg disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 ${
                  state === "listening"
                    ? "bg-cyan-500 text-white animate-pulse shadow-cyan-500/20"
                    : "bg-gradient-to-tr from-cyan-500 to-violet-500 text-white shadow-cyan-500/20"
                }`}
                title={state === "listening" ? "Click to send recording" : "Click to speak"}
              >
                {state === "listening" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Quick Clear */}
          {messages.length > 0 && (
            <button
              onClick={clearSession}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Reset Conversation
            </button>
          )}

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="text-xs text-rose-400 font-medium px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center w-full">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Case Transcript (Accessibility & Context) */}
      <div className="lg:col-span-5 flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.62-3.136c1.152-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v5.01Z" />
            </svg>
            Live Consultation Feed
          </h3>
          <span className="text-zinc-500 text-xs font-mono">{messages.length} messages</span>
        </div>

        {/* Scrollable feed list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[calc(100vh-20rem)] custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
              <div className="p-4 rounded-full bg-white/3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              </div>
              <p className="text-xs">No active transcripts. Start speaking, and the dialogue will appear here.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-sm border ${
                  msg.role === "user"
                    ? "ml-auto rounded-tr-none bg-cyan-900/10 border-cyan-500/20 text-white"
                    : "mr-auto rounded-tl-none bg-white/5 border-white/5 text-zinc-200"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  {msg.role === "user" ? "You" : "Justice AI"}
                </span>
                <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {msg.content}
                </p>
              </div>
            ))
          )}

          {/* Processing Loading Bubble */}
          {state === "processing" && (
            <div className="flex mr-auto w-fit max-w-[85%] rounded-2xl rounded-tl-none p-4 bg-white/5 border border-white/5 items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></div>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Formulating strategy...</span>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
}
