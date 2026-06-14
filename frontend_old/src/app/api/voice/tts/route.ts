import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, language } = body;

    if (!text) {
      return NextResponse.json(
        { error: "No text provided for synthesis." },
        { status: 400 }
      );
    }

    console.log(`[Next.js Voice Proxy] Requesting TTS synthesis for text: "${text.substring(0, 30)}..." (language=${language || "en-IN"})`);

    const backendResponse = await fetch("http://127.0.0.1:8000/api/voice/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, language: language || "en-IN" }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Backend TTS failed.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error(`[Next.js Voice Proxy] FastAPI TTS error: ${backendResponse.status} - ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: backendResponse.status });
    }

    // Read the audio content and return as binary response
    const audioBuffer = await backendResponse.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("[Next.js Voice Proxy] Error in TTS proxy:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error in Next.js TTS proxy route." },
      { status: 500 }
    );
  }
}
