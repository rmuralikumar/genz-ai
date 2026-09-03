import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { chatRequestSchema } from "@/lib/validation/chat";
import { createAiStream, StreamMessage } from "@/lib/ai/stream";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.format() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { conversationId, content, model, attachments } = parsed.data;

  // Verify conversation ownership
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: user.id,
    },
  });

  if (!conversation) {
    return new Response(
      JSON.stringify({ error: "Conversation not found or unauthorized" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const selectedModel = model || conversation.model || "genz-fast";

  // 1. Save user's message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content,
      model: selectedModel,
      attachments: attachments && attachments.length > 0 ? {
        create: attachments.map((att) => ({
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          url: att.url,
        })),
      } : undefined,
    },
  });

  // 2. Auto-generate title if this is the first message or titled "New Chat"
  if (conversation.title === "New Chat") {
    const rawTitle = content.trim().replace(/\n+/g, " ");
    const smartTitle = rawTitle.length > 36 ? rawTitle.substring(0, 36) + "..." : rawTitle;
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title: smartTitle, model: selectedModel },
    });
  }

  // 3. Load previous context messages (most recent 20 messages in chronological order)
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const streamMessages: StreamMessage[] = history.reverse().map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  // 4. Create AI stream
  let rawStream;
  try {
    rawStream = await createAiStream({
      messages: streamMessages,
      modelId: selectedModel,
    });
  } catch (err: unknown) {
    const errorObj = err as { userMessage?: string; code?: string; statusCode?: number };
    console.error("AI service error in /api/chat:", errorObj?.code || err);
    return new Response(
      JSON.stringify({
        error:
          errorObj?.userMessage ||
          "GENZ-AI encountered an error communicating with the AI service. Please try again.",
        code: errorObj?.code || "AI_PROVIDER_ERROR",
      }),
      {
        status: errorObj?.statusCode || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 5. Wrap stream to capture generated text and persist assistant message on completion
  const reader = rawStream.getReader();
  const decoder = new TextDecoder();
  let fullAssistantResponse = "";
  let hasStreamError = false;

  const responseStream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          // Stream completed. Persist assistant message ONLY if successful and not an error
          if (!hasStreamError && fullAssistantResponse.trim()) {
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: "assistant",
                content: fullAssistantResponse,
                model: selectedModel,
                tokensUsed: Math.ceil(fullAssistantResponse.length / 4),
              },
            });

            // Update conversation timestamp
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });

            // Record usage
            await prisma.usageRecord.create({
              data: {
                userId: user.id,
                model: selectedModel,
                promptTokens: Math.ceil(content.length / 4),
                completionTokens: Math.ceil(fullAssistantResponse.length / 4),
                totalTokens: Math.ceil((content.length + fullAssistantResponse.length) / 4),
              },
            });
          }

          controller.close();
          return;
        }

        // Parse SSE chunk to accumulate text or catch stream errors
        const textChunk = decoder.decode(value);
        const lines = textChunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                hasStreamError = true;
              } else if (data.text) {
                fullAssistantResponse += data.text;
              }
            } catch {
              // Non-critical SSE parse error
            }
          }
        }

        controller.enqueue(value);
      } catch (err) {
        console.error("Stream error in pull:", err);
        controller.error(err);
      }
    },
    cancel() {
      // User aborted stream. Persist whatever was generated so far ONLY if not error
      if (!hasStreamError && fullAssistantResponse.trim()) {
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: fullAssistantResponse,
            model: selectedModel,
          },
        }).catch(console.error);
      }
      reader.cancel().catch(console.error);
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
