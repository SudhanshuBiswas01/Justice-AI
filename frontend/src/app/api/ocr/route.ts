import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    // Create a new FormData instance to forward the file
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    console.log(`[Next.js API Proxy] Forwarding file ${file.name} (${file.size} bytes) to FastAPI...`);

    const backendResponse = await fetch("http://127.0.0.1:8000/api/ocr/extract", {
      method: "POST",
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Backend extraction failed.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      console.error(`[Next.js API Proxy] FastAPI returned error: ${backendResponse.status} - ${errorMessage}`);
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log(`[Next.js API Proxy] OCR extraction successful for ${file.name}`);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[Next.js API Proxy] Error in proxy route:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error in Next.js API route." },
      { status: 500 }
    );
  }
}
