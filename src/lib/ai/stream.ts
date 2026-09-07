import { getModelConfig } from "./models";
import { OLLAMA_TOOLS, TOOL_REGISTRY, ToolExecutionResult } from "./tools/registry";
import { parseToolCallFromResponse, parseActionFromContent, ParsedToolCall } from "./tools/parser";
import { detectVideoIntent } from "./intent_router";

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

5. Media & Tool Execution Capabilities:
   - VIDEO GENERATION: You have video generation capability via the 'video_generation' tool (powered by Replicate).
     When the user asks for a video, animation, or clip (e.g. "generate a video", "make a 5 second video", "video of ..."), ALWAYS call the video_generation tool!
     NEVER answer with "I can't directly generate video files" or "I cannot make videos" when video generation is requested.
     Do NOT offer to generate an image instead of a video when the user asked for a video.
   - IMAGE GENERATION: When the user asks for an image, drawing, or visual artwork, call the image_generation tool.
     Do NOT call image tools (like dalle.text2im) for video requests!
   - WEB SEARCH: Call web_search when current facts or web info are requested.
   - CALCULATOR: Call calculator for arithmetic and math computations.
   - TEXT TO SPEECH: Call text_to_speech for voice synthesis.
   - NEVER output raw unexecuted JSON (e.g., {"action": ...}) to the user. Always execute tools properly.

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

/**
 * Creates an AI response stream with built-in tool schema declaration,
 * tool call interception, tool execution, and seamless result streaming.
 */
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
  if (
    !lastUserMessage ||
    (!lastUserMessage.content.trim() && (!lastUserMessage.images || lastUserMessage.images.length === 0))
  ) {
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

  const baseUrl = (process.env.OLLAMA_BASE_URL || "https://ollama.com").replace(
    /\/+$/,
    ""
  );

  const encoder = new TextEncoder();

  // 4. Call Ollama API with tool definitions (POST ${baseUrl}/api/chat)
  let res: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(process.env.OLLAMA_API_KEY
      ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY.trim().replace(/^["']|["']$/g, "")}` }
      : {}),
  };

  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: ollamaMessages,
        tools: OLLAMA_TOOLS,
        stream: false,
      }),
    });
  } catch (err: unknown) {
    // If Ollama is unreachable, check if OpenAI API Key is available as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        return await createOpenAiFallbackStream(messages, process.env.OPENAI_API_KEY);
      } catch (openAiErr) {
        console.error("OpenAI fallback also failed:", openAiErr);
      }
    }

    console.error("Ollama connection failed:", err);
    throw new AiServiceError(
      "OLLAMA_NOT_RUNNING",
      `Unable to connect to Ollama service at ${baseUrl}. Please verify the service is available and model '${targetModel}' is accessible.`,
      503
    );
  }

  // 5. Handle Ollama error responses (e.g. model not pulled, 401 auth failure, 404)
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.error || "";
    } catch {
      errorDetail = res.statusText;
    }

    if (res.status === 401 || res.status === 403) {
      throw new AiServiceError(
        "OLLAMA_AUTH_ERROR",
        "Ollama Cloud authentication failed. Please verify your OLLAMA_API_KEY.",
        401
      );
    }

    const lowerError = errorDetail.toLowerCase();
    if (
      res.status === 404 ||
      lowerError.includes("not found") ||
      lowerError.includes("try pulling")
    ) {
      throw new AiServiceError(
        "OLLAMA_MODEL_NOT_FOUND",
        `The model '${targetModel}' is not found in Ollama. Please ensure the model is available.`,
        404
      );
    }

    throw new AiServiceError(
      "OLLAMA_ERROR",
      `Ollama service error: ${errorDetail || res.statusText}`,
      res.status >= 400 && res.status < 600 ? res.status : 502
    );
  }

  // 6. Read generated response
  interface OllamaResponsePayload {
    message?: {
      content?: string;
      tool_calls?: Array<{
        id?: string;
        function?: {
          name?: string;
          arguments?: Record<string, unknown> | string;
        };
      }>;
    };
  }

  let data: OllamaResponsePayload;
  try {
    data = await res.json();
  } catch (err: unknown) {
    console.error("Failed to parse Ollama JSON response:", err);
    throw new AiServiceError(
      "OLLAMA_INVALID_RESPONSE",
      "Received an invalid response format from the Ollama service.",
      502
    );
  }

  const rawMessage = data.message || {};
  const generatedContent = rawMessage.content ?? "";

  // 7. Parse tool call from native tool_calls OR ReAct action JSON in message.content
  let parsedTool: ParsedToolCall | null = parseToolCallFromResponse(rawMessage);
  if (!parsedTool && generatedContent) {
    parsedTool = parseActionFromContent(generatedContent);
  }

  // Detect if user or conversation history has video intent
  const lastUserText = lastUserMessage?.content || "";
  const userVideoIntent = detectVideoIntent(lastUserText);

  // CRITICAL REQUIREMENT: Do NOT route video requests to image_generation or dalle.text2im
  if (userVideoIntent.isVideo && parsedTool) {
    if (parsedTool.tool.name === "image_generation") {
      parsedTool = {
        tool: TOOL_REGISTRY.video_generation,
        rawName: "video_generation",
        args: {
          prompt: userVideoIntent.prompt || String(parsedTool.args.prompt || "a cinematic video"),
        },
      };
    }
  }

  // 8. If a tool call is detected, EXECUTE IT!
  if (parsedTool) {
    return handleToolExecutionStream({
      parsedTool,
      messages,
      baseUrl,
      headers,
      targetModel,
      encoder,
    });
  }

  // 9. Extra safety guard: check if plain text has an embedded action JSON
  let fallbackAction = parseActionFromContent(generatedContent);
  if (fallbackAction) {
    if (userVideoIntent.isVideo && fallbackAction.tool.name === "image_generation") {
      fallbackAction = {
        tool: TOOL_REGISTRY.video_generation,
        rawName: "video_generation",
        args: {
          prompt: userVideoIntent.prompt || String(fallbackAction.args.prompt || "a cinematic video"),
        },
      };
    }
    return handleToolExecutionStream({
      parsedTool: fallbackAction,
      messages,
      baseUrl,
      headers,
      targetModel,
      encoder,
    });
  }

  // 10. CRITICAL REQUIREMENT: NEVER expose raw ReAct/action JSON to the user!
  let safeContent = generatedContent;
  if (
    /"action"\s*:\s*"dalle\.text2im"/i.test(safeContent) ||
    (/"action"\s*:\s*"/i.test(safeContent) && /"action_input"/i.test(safeContent))
  ) {
    const emergencyAction = parseActionFromContent(safeContent);
    if (emergencyAction) {
      if (userVideoIntent.isVideo && emergencyAction.tool.name === "image_generation") {
        emergencyAction.tool = TOOL_REGISTRY.video_generation;
      }
      return handleToolExecutionStream({
        parsedTool: emergencyAction,
        messages,
        baseUrl,
        headers,
        targetModel,
        encoder,
      });
    }
    // Cleanly strip raw action JSON from text output
    safeContent = safeContent.replace(/\{[\s\S]*?"action"[\s\S]*?\}/gi, "").trim();
    if (!safeContent) {
      safeContent = "Processing your request with AI tools...";
    }
  }

  // 11. Natural conversational response streaming
  return new ReadableStream({
    async start(controller) {
      try {
        await streamTokens(safeContent, controller, encoder);
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
 * Handles executing a tool and streaming the result (or second-turn synthesis) cleanly to the client.
 */
function handleToolExecutionStream({
  parsedTool,
  messages,
  baseUrl,
  headers,
  targetModel,
  encoder,
}: {
  parsedTool: ParsedToolCall;
  messages: StreamMessage[];
  baseUrl: string;
  headers: Record<string, string>;
  targetModel: string;
  encoder: TextEncoder;
}): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        // Execute the tool
        const toolResult: ToolExecutionResult = await parsedTool.tool.execute(parsedTool.args);

        // CASE 1: Image Generation / Search Result
        if (toolResult.type === "image") {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "image",
                mode: toolResult.mode,
                images: toolResult.images,
                text: toolResult.text,
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // CASE 2: Web Search Result (Emit sources tray + second turn synthesis)
        if (toolResult.type === "sources") {
          if (toolResult.sources && toolResult.sources.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "sources",
                  sources: toolResult.sources,
                })}\n\n`
              )
            );
          }

          // Second-turn LLM synthesis with verified facts
          try {
            const query = String(parsedTool.args.query || "");
            const followUpMessages = [
              { role: "system", content: GENZ_SYSTEM_PROMPT },
              ...messages.map((m) => ({
                role: m.role,
                content: m.content || "",
              })),
              {
                role: "assistant",
                content: `I will check the latest web sources for: "${query}"`,
              },
              {
                role: "user",
                content: `Here are the latest verified search findings for "${query}":\n\n${toolResult.text}\n\nPlease synthesize a clear, friendly, and comprehensive answer for the user based on these verified facts. Mention key facts directly with natural citations.`,
              },
            ];

            const secondTurnRes = await fetch(`${baseUrl}/api/chat`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                model: targetModel,
                messages: followUpMessages,
                stream: false,
              }),
            });

            if (secondTurnRes.ok) {
              const secondData = await secondTurnRes.json();
              const synthesisText = secondData.message?.content || toolResult.text || "";
              await streamTokens(synthesisText, controller, encoder);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          } catch (synthErr) {
            console.warn("Second-turn synthesis error:", synthErr);
          }

          // Fallback: output search summary directly
          await streamTokens(
            toolResult.text || "Found relevant web sources above.",
            controller,
            encoder
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // CASE 3: Calculator / Math Execution
        if (toolResult.type === "text") {
          await streamTokens(toolResult.text, controller, encoder);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // CASE 4: Audio / Text-to-Speech
        if (toolResult.type === "audio") {
          await streamTokens(toolResult.text, controller, encoder);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // CASE 5: Video Generation Result
        if (toolResult.type === "video") {
          await streamTokens(toolResult.text, controller, encoder);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // CASE 6: Error / Provider Missing
        if (toolResult.type === "error") {
          await streamTokens(toolResult.error, controller, encoder);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Default: close
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err: unknown) {
        console.error("Tool execution failed in stream:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Encountered an unexpected error executing tool.";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              text: `⚠️ **Action Execution Error:** ${errMsg}`,
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

/**
 * Splits text into natural tokens and streams with smooth typing pacing.
 */
async function streamTokens(
  text: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
): Promise<void> {
  if (!text) return;
  const tokens = text.match(/\S+|\s+/g) || [text];
  const chunkSize = 3;

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize).join("");
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
    );

    if (tokens.length > 10) {
      await new Promise((r) => setTimeout(r, 12));
    }
  }
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

  const openAiTools = OLLAMA_TOOLS.map((t) => ({
    type: "function" as const,
    function: t.function,
  }));

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: openAiMessages,
      tools: openAiTools,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  interface OpenAiChoice {
    message?: {
      content?: string;
      tool_calls?: Array<{
        id?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
  }

  const openAiData: { choices?: OpenAiChoice[] } = await res.json();
  const choice = openAiData.choices?.[0]?.message;
  const encoder = new TextEncoder();

  if (choice) {
    let parsedTool = parseToolCallFromResponse(choice);
    if (!parsedTool && choice.content) {
      parsedTool = parseActionFromContent(choice.content);
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userVideoIntent = lastUserMsg?.content ? detectVideoIntent(lastUserMsg.content) : { isVideo: false, prompt: "" };

    if (userVideoIntent.isVideo && parsedTool && parsedTool.tool.name === "image_generation") {
      parsedTool = {
        tool: TOOL_REGISTRY.video_generation,
        rawName: "video_generation",
        args: { prompt: userVideoIntent.prompt || String(parsedTool.args.prompt || "a cinematic video") },
      };
    }

    if (parsedTool) {
      const toolResult = await parsedTool.tool.execute(parsedTool.args);
      return new ReadableStream({
        async start(controller) {
          if (toolResult.type === "image") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "image",
                  mode: toolResult.mode,
                  images: toolResult.images,
                  text: toolResult.text,
                })}\n\n`
              )
            );
          } else if (toolResult.type === "sources") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "sources",
                  sources: toolResult.sources,
                })}\n\n`
              )
            );
            await streamTokens(toolResult.text || "", controller, encoder);
          } else if (toolResult.type === "text" || toolResult.type === "audio" || toolResult.type === "video") {
            await streamTokens(toolResult.text, controller, encoder);
          } else if (toolResult.type === "error") {
            await streamTokens(toolResult.error, controller, encoder);
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
    }

    const content = choice.content || "";
    return new ReadableStream({
      async start(controller) {
        await streamTokens(content, controller, encoder);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
  }

  throw new Error("No response choices received from OpenAI");
}
