import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' array is required." },
        { status: 400 }
      );
    }

    console.log(
      `[Next.js Chat Proxy] Forwarding chat request (${body.messages.length} messages) to FastAPI...`
    );

    const backendResponse = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      let errorMessage = "Backend chat request failed.";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error(
        `[Next.js Chat Proxy] FastAPI error: ${backendResponse.status} - ${errorMessage}`
      );
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Next.js Chat Proxy] Error in chat proxy:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Internal Server Error in Next.js chat proxy route.",
      },
      { status: 500 }
    );
  }
}
