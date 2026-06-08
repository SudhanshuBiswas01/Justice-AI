"use client";

import { useState, useRef, useEffect } from "react";

export default function MicTestPage() {
  const [status, setStatus] = useState<string>("Click 'Test Microphone' to start");
  const [volume, setVolume] = useState<number>(0);
  const [maxVolume, setMaxVolume] = useState<number>(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [sttResult, setSttResult] = useState<string>("");
  const [sttStatus, setSttStatus] = useState<string>("");
  
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  // List available audio input devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devs) => {
      const audioInputs = devs.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    });
  }, []);

  const startMicTest = async () => {
    try {
      // Stop any existing stream
      stopMicTest();

      const constraints: MediaStreamConstraints = {
        audio: selectedDevice
          ? { deviceId: { exact: selectedDevice }, channelCount: 1, echoCancellation: true, noiseSuppression: true }
          : { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      };

      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      setStatus(`✅ Microphone active! Speak now... (Track: ${stream.getAudioTracks()[0].label})`);
      setIsListening(true);
      setMaxVolume(0);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.round((avg / 255) * 100);
        setVolume(normalized);
        setMaxVolume((prev) => Math.max(prev, normalized));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`❌ Microphone error: ${msg}`);
      setIsListening(false);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setVolume(0);
  };

  // Test browser Web Speech API
  const testWebSpeechAPI = () => {
    setSttResult("");
    setSttStatus("Starting Web Speech API...");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttStatus("❌ Web Speech API NOT available in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSttResult(transcript);
      setSttStatus("✅ Speech detected!");
    };

    recognition.onerror = (event: any) => {
      setSttStatus(`❌ Web Speech API error: ${event.error}`);
    };

    recognition.onend = () => {
      if (!sttResult) {
        setSttStatus((prev) => prev.startsWith("❌") ? prev : "⚠️ Recognition ended (no final result)");
      }
    };

    recognition.start();
    setSttStatus("🎤 Listening for 10 seconds... speak now!");
  };

  return (
    <div style={{ padding: 40, maxWidth: 700, margin: "0 auto", fontFamily: "system-ui", color: "#fff", background: "#111", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🔧 Microphone Diagnostic</h1>
      <p style={{ color: "#888", marginBottom: 30 }}>This page tests whether your microphone is actually capturing audio.</p>

      {/* Device Selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Audio Input Device:</label>
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, background: "#222", color: "#fff", border: "1px solid #444", fontSize: 14 }}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Device ${d.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      {/* Test 1: Raw Audio Level */}
      <div style={{ marginBottom: 30, padding: 20, background: "#1a1a1a", borderRadius: 12, border: "1px solid #333" }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Test 1: Raw Audio Level</h2>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 15 }}>Checks if your microphone captures any sound at all.</p>
        
        <button
          onClick={isListening ? stopMicTest : startMicTest}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
            background: isListening ? "#ef4444" : "#22c55e", color: "#fff",
          }}
        >
          {isListening ? "Stop" : "Test Microphone"}
        </button>

        <p style={{ marginTop: 12, color: "#ccc" }}>{status}</p>

        {/* Volume Bar */}
        <div style={{ marginTop: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 4 }}>
            <span>Volume Level</span>
            <span>{volume}% (Max: {maxVolume}%)</span>
          </div>
          <div style={{ height: 24, background: "#333", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${volume}%`,
                background: volume > 30 ? "#22c55e" : volume > 10 ? "#eab308" : "#ef4444",
                borderRadius: 12,
                transition: "width 0.05s",
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            {maxVolume === 0 && isListening && "⚠️ No audio detected yet — try speaking louder or check your mic"}
            {maxVolume > 0 && maxVolume <= 5 && "⚠️ Very faint signal — mic may be muted or too far"}
            {maxVolume > 5 && maxVolume <= 20 && "🟡 Low signal — try speaking louder"}
            {maxVolume > 20 && "✅ Good signal — microphone is working!"}
          </div>
        </div>
      </div>

      {/* Test 2: Web Speech API */}
      <div style={{ padding: 20, background: "#1a1a1a", borderRadius: 12, border: "1px solid #333" }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Test 2: Web Speech API (Browser STT)</h2>
        <p style={{ color: "#aaa", fontSize: 13, marginBottom: 15 }}>Tests if the browser can convert your speech to text.</p>

        <button
          onClick={testWebSpeechAPI}
          style={{
            padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
            background: "#3b82f6", color: "#fff",
          }}
        >
          Test Speech Recognition
        </button>

        <p style={{ marginTop: 12, color: "#ccc" }}>{sttStatus}</p>
        {sttResult && (
          <div style={{ marginTop: 10, padding: 12, background: "#0a3622", borderRadius: 8, border: "1px solid #166534" }}>
            <strong>Recognized:</strong> &ldquo;{sttResult}&rdquo;
          </div>
        )}
      </div>

      {/* Troubleshooting Guide */}
      <div style={{ marginTop: 30, padding: 20, background: "#1a1a1a", borderRadius: 12, border: "1px solid #333" }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>💡 Troubleshooting</h2>
        <ul style={{ color: "#aaa", fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>🔇 <strong>Windows:</strong> Right-click speaker icon → Sound Settings → Input → Make sure correct mic is selected and NOT muted</li>
          <li>🔒 <strong>Browser:</strong> Click the lock/site icon in the URL bar → Ensure Microphone is set to &quot;Allow&quot;</li>
          <li>🎧 <strong>Headset:</strong> If using a headset/earbuds, make sure it has a working mic and is set as default input</li>
          <li>🔊 <strong>Volume:</strong> Check if your mic volume is turned up in Windows Sound Settings → Input → Device Properties</li>
          <li>🔄 <strong>Restart:</strong> Try closing and reopening Chrome completely</li>
        </ul>
      </div>
    </div>
  );
}
