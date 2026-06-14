import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://127.0.0.1:8000";

// POST /api/voice/stt — speech-to-text proxy
export async function POST(request: NextRequest) {
  try {
    const { pathname, searchParams } = new URL(request.url);
    const action = pathname.endsWith("/tts") ? "tts" : "stt";

    if (action === "stt") {
      const formData = await request.formData();
      const language = searchParams.get("language") || "en-IN";

      const backendResponse = await fetch(
        `${BACKEND}/api/voice/stt?language=${language}`,
        { method: "POST", body: formData }
      );

      if (!backendResponse.ok) {
        const err = await backendResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: err?.detail || "STT failed" },
          { status: backendResponse.status }
        );
      }
      return NextResponse.json(await backendResponse.json());
    }

    // TTS
    const body = await request.json();
    const backendResponse = await fetch(`${BACKEND}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const err = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.detail || "TTS failed" },
        { status: backendResponse.status }
      );
    }

    const audioBuffer = await backendResponse.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error in voice proxy." },
      { status: 500 }
    );
  }
}
