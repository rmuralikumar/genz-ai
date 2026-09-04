import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { chatRequestSchema } from "@/lib/validation/chat";
import { createAiStream, StreamMessage } from "@/lib/ai/stream";
import { searchImages, generateAiImage } from "@/lib/ai/image";
import { resolveIntent } from "@/lib/ai/intent_router";
import { performWebSearch, buildSearchAugmentedPrompt } from "@/lib/ai/web_search";
import { executeDeepResearch } from "@/lib/ai/deep_research";
import { parseUploadedFile } from "@/lib/ai/file_parser";

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

  const { conversationId, content, model, attachments, isRetry } = parsed.data;

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

  // 1. Save user's message (skip if isRetry to avoid duplicating the prompt)
  if (isRetry) {
    const lastMsg = await prisma.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastMsg && lastMsg.role === "assistant") {
      await prisma.message.delete({ where: { id: lastMsg.id } });
    }
  } else {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content,
        model: selectedModel,
        attachments:
          attachments && attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  filename: att.filename,
                  mimeType: att.mimeType,
                  size: att.size,
                  url: att.url,
                })),
              }
            : undefined,
      },
    });
  }

  // 2. Auto-generate title if this is the first message or titled "New Chat"
  if (conversation.title === "New Chat") {
    const rawTitle = content.trim().replace(/\n+/g, " ");
    const smartTitle = rawTitle.length > 36 ? rawTitle.substring(0, 36) + "..." : rawTitle;
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { title: smartTitle, model: selectedModel },
    });
  }

  // 3. Resolve Intent
  const resolved = resolveIntent({
    content,
    attachments,
    modelId: selectedModel,
  });

  const encoder = new TextEncoder();

  // ==========================================
  // CASE A: IMAGE SEARCH & GENERATION
  // ==========================================
  if (resolved.intent === "IMAGE_SEARCH" || resolved.intent === "IMAGE_GENERATION") {
    const imageIntent = resolved.imageIntent!;
    const imageStream = new ReadableStream({
      async start(controller) {
        try {
          if (resolved.intent === "IMAGE_SEARCH") {
            const statusText = `*🔍 Finding photos for **${imageIntent.prompt}**...*\n\n`;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "status", mode: "search", text: statusText })}\n\n`
              )
            );

            const searchResults = await searchImages(imageIntent.prompt);

            if (searchResults && searchResults.length > 0) {
              const primaryImg = searchResults[0];
              const caption = `Here is a photo of **${imageIntent.prompt}**:`;
              const finalMarkdown = `${caption}\n\n![${primaryImg.alt || imageIntent.prompt}](${primaryImg.url})\n\n`;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "image",
                    mode: "search",
                    images: searchResults,
                    text: finalMarkdown,
                  })}\n\n`
                )
              );

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();

              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: "assistant",
                  content: finalMarkdown,
                  model: "genz-search",
                  tokensUsed: 100,
                  attachments: {
                    create: searchResults.map((item) => ({
                      filename: `${(item.alt || imageIntent.prompt).slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`,
                      mimeType: item.mimeType || "image/jpeg",
                      size: item.size || 150000,
                      url: item.url,
                    })),
                  },
                },
              });

              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
              });

              await prisma.usageRecord.create({
                data: {
                  userId: user.id,
                  model: "genz-search",
                  promptTokens: Math.ceil(content.length / 4),
                  completionTokens: 50,
                  totalTokens: Math.ceil(content.length / 4) + 50,
                },
              });
            } else {
              const notFoundText = `I couldn't find any photos for "**${imageIntent.prompt}**". Would you like me to generate an AI image of it instead? 🎨`;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", text: notFoundText })}\n\n`)
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();

              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  role: "assistant",
                  content: notFoundText,
                  model: "genz-search",
                },
              });
            }
          } else {
            // IMAGE_GENERATION
            const statusText = `*🎨 Generating image for you: **${imageIntent.prompt}**...*\n\n`;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "status", mode: "generate", text: statusText })}\n\n`
              )
            );

            const imageResult = await generateAiImage(imageIntent.prompt);
            const caption = `Here is your generated image of **${imageIntent.prompt}**:`;
            const finalMarkdown = `${caption}\n\n![${imageIntent.prompt}](${imageResult.url})\n\n`;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "image",
                  mode: "generate",
                  images: [imageResult],
                  text: finalMarkdown,
                })}\n\n`
              )
            );

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();

            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: "assistant",
                content: finalMarkdown,
                model: "genz-creative",
                tokensUsed: 150,
                attachments: {
                  create: [
                    {
                      filename: `${imageIntent.prompt.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, "_")}.jpg`,
                      mimeType: imageResult.mimeType || "image/jpeg",
                      size: imageResult.size || 150000,
                      url: imageResult.url,
                    },
                  ],
                },
              },
            });

            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });

            await prisma.usageRecord.create({
              data: {
                userId: user.id,
                model: "genz-creative",
                promptTokens: Math.ceil(content.length / 4),
                completionTokens: 50,
                totalTokens: Math.ceil(content.length / 4) + 50,
              },
            });
          }
        } catch (imageErr: unknown) {
          console.error("Image operation failed:", imageErr);
          const errorMsg =
            "Sorry, I couldn't retrieve or generate that image right now. Please try again with a different prompt! 🎨";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text: errorMsg })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: errorMsg,
              model: "genz-creative",
            },
          });
        }
      },
    });

    return new Response(imageStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ==========================================
  // CASE B: DEEP RESEARCH MODE
  // ==========================================
  if (resolved.intent === "DEEP_RESEARCH") {
    const researchStream = new ReadableStream({
      async start(controller) {
        try {
          const researchResult = await executeDeepResearch(
            resolved.targetQuery,
            (step, statusText) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "research_step",
                    step,
                    text: `*${statusText}*\n\n`,
                  })}\n\n`
                )
              );
            }
          );

          // Emit sources and full research report
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "research",
                text: researchResult.reportMarkdown,
                sources: researchResult.sources,
                steps: researchResult.steps,
              })}\n\n`
            )
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: researchResult.reportMarkdown,
              model: "genz-reasoning",
              tokensUsed: Math.ceil(researchResult.reportMarkdown.length / 4),
            },
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });

          await prisma.usageRecord.create({
            data: {
              userId: user.id,
              model: "genz-reasoning",
              promptTokens: Math.ceil(content.length / 4),
              completionTokens: Math.ceil(researchResult.reportMarkdown.length / 4),
              totalTokens:
                Math.ceil(content.length / 4) +
                Math.ceil(researchResult.reportMarkdown.length / 4),
            },
          });
        } catch (err: unknown) {
          console.error("Deep research error:", err);
          const errMsg = "Research pipeline encountered an error while searching sources. Falling back to direct analysis.";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "text", text: errMsg })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(researchStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ==========================================
  // CASE C: REAL WEB SEARCH
  // ==========================================
  let effectivePrompt = content;
  let searchSourcesToSend: Array<{ id: number; title: string; url: string; source: string; snippet: string }> = [];

  if (resolved.intent === "WEB_SEARCH") {
    try {
      const searchRes = await performWebSearch(resolved.targetQuery, 5);
      if (searchRes.results.length > 0) {
        searchSourcesToSend = searchRes.results;
        effectivePrompt = buildSearchAugmentedPrompt(content, searchRes);
      }
    } catch (err) {
      console.warn("Web search lookup error:", err);
    }
  }

  // ==========================================
  // CASE D: FILE ANALYSIS
  // ==========================================
  if (resolved.intent === "FILE_ANALYSIS" && attachments && attachments.length > 0) {
    try {
      const parsedDocs = await Promise.all(
        attachments
          .filter((a) => !a.mimeType.startsWith("image/"))
          .map((att) => parseUploadedFile(att.url, att.filename, att.mimeType, content))
      );

      const combinedDocs = parsedDocs
        .map((doc) => `=== Document: ${doc.filename} ===\n${doc.extractedText}`)
        .join("\n\n");

      effectivePrompt = `${combinedDocs}\n\n=== User Request regarding Document ===\n${content || "Analyze and summarize this document."}`;
    } catch (docErr) {
      console.error("File analysis parsing failed:", docErr);
    }
  }

  // ==========================================
  // CASE E: IMAGE UNDERSTANDING / VISION
  // ==========================================
  let extractedImagesBase64: string[] | undefined = undefined;
  if (attachments && attachments.length > 0) {
    const imgAtts = attachments.filter((a) => a.mimeType.startsWith("image/"));
    if (imgAtts.length > 0) {
      extractedImagesBase64 = imgAtts.map((a) => {
        // Strip data:image/...;base64, prefix
        const commaIdx = a.url.indexOf(",");
        return commaIdx !== -1 ? a.url.slice(commaIdx + 1) : a.url;
      });
    }
  }

  // Load context history
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const streamMessages: StreamMessage[] = history.reverse().map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  // Append current prompt with vision and search context
  const currentStreamMessage: StreamMessage = {
    role: "user",
    content: effectivePrompt,
    images: extractedImagesBase64,
  };
  streamMessages.push(currentStreamMessage);

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

  // 5. Wrap stream to capture generated text, send sources, and persist assistant message
  const reader = rawStream.getReader();
  const decoder = new TextDecoder();
  let fullAssistantResponse = "";
  let hasStreamError = false;
  let sentSources = false;

  const responseStream = new ReadableStream({
    async pull(controller) {
      try {
        // Send initial sources if available from web search
        if (!sentSources && searchSourcesToSend.length > 0) {
          sentSources = true;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "sources",
                sources: searchSourcesToSend,
              })}\n\n`
            )
          );
        }

        const { done, value } = await reader.read();
        if (done) {
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

            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });

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
      if (!hasStreamError && fullAssistantResponse.trim()) {
        prisma.message
          .create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: fullAssistantResponse,
              model: selectedModel,
            },
          })
          .catch(console.error);
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
