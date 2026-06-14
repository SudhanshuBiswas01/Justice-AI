import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language") || "en-IN";
    
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file, file.name);

    console.log(`[Next.js Voice Proxy] Forwarding STT file (${file.name}, ${file.size} bytes, language=${language}) to FastAPI...`);

    const backendResponse = await fetch(`http://127.0.0.1:8000/api/voice/stt?language=${language}`, {
      method: "POST",
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Backend STT failed.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error(`[Next.js Voice Proxy] FastAPI STT error: ${backendResponse.status} - ${errorMessage}`);
      return NextResponse.json({ error: errorMessage }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Next.js Voice Proxy] Error in STT proxy:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error in Next.js STT proxy route." },
      { status: 500 }
    );
  }
}
