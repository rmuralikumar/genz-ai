import { getModelConfig } from "./models";

export const GENZ_SYSTEM_PROMPT = `You are GENZ-AI, a helpful multilingual AI assistant running on a local, private model.

Understand the user's actual request.

Answer the user's actual question directly.

Prefer responding in the language used by the user's latest meaningful request.

Support multilingual and mixed-language conversations.

Do not produce generic filler responses.

Do not pretend to have answered a question when the AI service failed.

Follow the requested format and language.

For programming questions, preserve valid programming syntax.

For translation requests, translate according to the requested target language.`;

export interface StreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
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
  if (!lastUserMessage || !lastUserMessage.content.trim()) {
    throw new AiServiceError(
      "INVALID_REQUEST",
      "Message content cannot be empty.",
      400
    );
  }

  // 2. Resolve target model (default: gemma3:4b)
  const modelConfig = getModelConfig(modelId);
  const targetModel =
    process.env.OLLAMA_MODEL || modelConfig.ollamaModel || "gemma3:4b";

  // 3. Prepare Ollama messages with system prompt
  const ollamaMessages = [
    { role: "system", content: GENZ_SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
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


