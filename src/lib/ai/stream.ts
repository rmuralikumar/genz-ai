import { getModelConfig } from "./models";

export const GENZ_SYSTEM_PROMPT = `You are GENZ-AI, a smart, friendly, and natural conversational AI assistant.
You have native-level fluency in English, Tamil, and Tanglish (Tamil words written using the English alphabet).

PRIMARY GUIDELINES:
1. Automatic Language & Script Detection:
   - If the user messages in Tanglish (e.g., "enna panra", "saptiya?", "epdi irukka", "nalla irukiya", "puriyala"), always reply in natural, colloquial Tanglish.
   - If the user uses mixed Tamil + English (e.g., "machine learning na enna?", "next step enna bro?"), reply in natural mixed Tanglish/English.
   - If the user writes in Tamil script (தமிழ் எழுத்துக்கள்), reply in Tamil script.
   - If the user writes in English, reply in English.
   - If the user asks to explain in Tanglish (e.g., "exp tanglish", "tanglish-la sollu", "in tanglish"), ALWAYS respond in Tanglish.

2. Tone, Style & Casual Slang:
   - Match the user's conversational vibe: warm, friendly, casual, and energetic.
   - Use light, natural emojis (😄, 😎, ✨, 👍, etc.) to enhance the friendly persona.
   - Avoid robotic, overly formal, or repetitive corporate responses.
   - DO NOT unnecessarily translate Tanglish into formal Tamil script (e.g., do NOT reply with "வணக்கம்" when the user greeted in Tanglish). Keep it in natural Romanized letters.
   - Naturally understand everyday Tamil/Tanglish slang: "machi", "bro", "thala", "enna panra", "saptiya", "epdi irukka", "semma", "mass", "vibe", "puriyala", "sollu", "podu", "vera level", "apdiya", "illa", "aama".

3. Explanations ("exp", "explain", "puriyala", "na enna?"):
   - When the user uses "exp", "explain", "puriyala", or asks "[topic] na enna?", give a clear, simple explanation with relatable real-world examples.
   - DO NOT claim or announce "Exp means explain" every time; understand it seamlessly from context.
   - For casual questions (e.g., "enna panra", "saptiya?"), keep replies short, warm, and conversational.
   - For educational or technical questions, provide clear explanations with intuitive analogies.

4. Consistency & Personality:
   - Maintain the same engaging, helpful GENZ-AI personality across all turns of the conversation.

5. Image, Media & Visual Requests:
   - Visual and image requests are handled by GENZ-AI's dedicated image engine.
   - NEVER hallucinate or pretend you are sending or displaying a photo in plain text when you cannot.
   - Keep answers helpful, accurate, and conversational without fake image announcements.

FEW-SHOT EXAMPLES:
User: enna panra
Assistant: Naan inga un kitta pesitu irukken 😄 Enna help venum?

User: saptiya?
Assistant: Innum illa 😄 Nee saptiya?

User: what is your name exp tanglish
Assistant: En peru GENZ-AI 😎 Naan oru multilingual AI assistant. Simple-ah sonna, un kooda Tamil, Tanglish, English-la pesuven!

User: machine learning na enna?
Assistant: Machine Learning-na, computer-ku direct-ah every rule sollama, data-la irundhu patterns learn panna teach panradhu. Simple example-na, neraya cat photos kudutha, adutha photo cat-ah illaya-nu identify panna model learn pannum.

User: epdi irukka?
Assistant: Super-ah irukken! Nee epdi irukka? Innaiku enna plan? 😄`;

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
}

export class AiServiceError extends Error {
  code: string;
  userMessage: string;
  statusCode: number;

  constructor(code: string, userMessage: string, statusCode: number = 500) {
    super(userMessage);
    this.name = "AiServiceError";
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
  }
}

export async function createAiStream({
  messages,
  modelId,
}: {
  messages: StreamMessage[];
  modelId?: string;
}): Promise<ReadableStream<Uint8Array>> {
  // 1. Validate missing or empty messages
  if (!messages || messages.length === 0) {
    throw new AiServiceError(
      "INVALID_REQUEST",
      "Message content cannot be empty.",
      400
    );
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMessage || (!lastUserMessage.content.trim() && (!lastUserMessage.images || lastUserMessage.images.length === 0))) {
    throw new AiServiceError(
      "INVALID_REQUEST",
      "Message content or image attachment cannot be empty.",
      400
    );
  }

  // 2. Resolve target model (default: gemma3:4b)
  const modelConfig = getModelConfig(modelId);
  const targetModel =
    process.env.OLLAMA_MODEL || modelConfig.ollamaModel || "gemma3:4b";

  // 3. Prepare Ollama messages with system prompt & multimodal images
  const ollamaMessages = [
    { role: "system", content: GENZ_SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content || "Analyze this image.",
      images: m.images && m.images.length > 0 ? m.images : undefined,
    })),
  ];

  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(
    /\/+$/,
    ""
  );

  // 4. Call Ollama local API (POST http://localhost:11434/api/chat)
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: targetModel,
        messages: ollamaMessages,
        stream: false,
      }),
    });
  } catch (err: unknown) {
    // If Ollama is not running, check if OpenAI API Key is available as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        return await createOpenAiFallbackStream(messages, process.env.OPENAI_API_KEY);
      } catch (openAiErr) {
        console.error("OpenAI fallback also failed:", openAiErr);
      }
    }

    console.error("Local Ollama connection failed:", err);
    throw new AiServiceError(
      "OLLAMA_NOT_RUNNING",
      `Ollama is not running locally at ${baseUrl}. Please start Ollama with 'ollama serve' in your terminal, and ensure model '${targetModel}' is installed with 'ollama pull ${targetModel}'.`,
      503
    );
  }

  // 5. Handle Ollama error responses (e.g. model not pulled, 404)
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.error || "";
    } catch {
      errorDetail = res.statusText;
    }

    const lowerError = errorDetail.toLowerCase();
    if (
      res.status === 404 ||
      lowerError.includes("not found") ||
      lowerError.includes("try pulling")
    ) {
      throw new AiServiceError(
        "OLLAMA_MODEL_NOT_FOUND",
        `The model '${targetModel}' is not installed in Ollama. Please download it by running: 'ollama pull ${targetModel}' in your terminal.`,
        404
      );
    }

    throw new AiServiceError(
      "OLLAMA_ERROR",
      `Ollama service error: ${errorDetail || res.statusText}`,
      res.status >= 400 && res.status < 600 ? res.status : 502
    );
  }

  // 6. Read generated response from data.message.content
  let data: { message?: { content?: string } };
  try {
    data = await res.json();
  } catch (err: unknown) {
    console.error("Failed to parse Ollama JSON response:", err);
    throw new AiServiceError(
      "OLLAMA_INVALID_RESPONSE",
      "Received an invalid response format from the local Ollama service.",
      502
    );
  }

  const generatedContent = data.message?.content ?? "";

  // 7. Return ReadableStream emitting SSE chunks compatible with existing frontend
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Chunk generated content into natural words/tokens for smooth streaming UX
        const tokens = generatedContent.match(/\S+|\s+/g) || [generatedContent];
        const chunkSize = 3;

        for (let i = 0; i < tokens.length; i += chunkSize) {
          const chunk = tokens.slice(i, i + chunkSize).join("");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );

          if (tokens.length > 10) {
            await new Promise((r) => setTimeout(r, 15));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Error while streaming response";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: errorMsg,
              code: "AI_PROVIDER_ERROR",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

/**
 * OpenAI Chat & Vision fallback stream when Ollama is unavailable
 */
async function createOpenAiFallbackStream(
  messages: StreamMessage[],
  apiKey: string
): Promise<ReadableStream<Uint8Array>> {
  const openAiMessages = [
    { role: "system", content: GENZ_SYSTEM_PROMPT },
    ...messages.map((m) => {
      if (m.images && m.images.length > 0) {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Describe and analyze this image." },
            ...m.images.map((img) => ({
              type: "image_url",
              image_url: {
                url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`,
              },
            })),
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    }),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No OpenAI response stream");

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
    },
  });
}
