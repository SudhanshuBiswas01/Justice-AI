import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const backendResponse = await fetch(`${BACKEND}/api/ocr/extract`, {
      method: "POST",
      body: formData,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "OCR extraction failed.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json({ error: errorMessage }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error in OCR proxy." },
      { status: 500 }
    );
  }
}
