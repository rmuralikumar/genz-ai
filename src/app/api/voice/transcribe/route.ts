import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const whisperFormData = new FormData();
      whisperFormData.append("file", audioFile);
      whisperFormData.append("model", "whisper-1");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      });

      if (whisperRes.ok) {
        const whisperData = await whisperRes.json();
        return NextResponse.json({ text: whisperData.text });
      }
    }

    return NextResponse.json(
      {
        error: "Server-side Whisper requires OPENAI_API_KEY. Please use browser speech recognition.",
        fallback: true,
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Audio transcription error:", err);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
