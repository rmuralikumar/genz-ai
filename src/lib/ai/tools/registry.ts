/**
 * GENZ-AI Tool Registry & Execution Engine
 * Canonical definitions, alias mapping, and executors for all AI tools.
 */

import { generateAiImage, ImageResultItem } from "../image";
import { performWebSearch, WebSearchResponse, SearchResult } from "../web_search";

export interface ToolDefinition {
  name: string;
  aliases: string[];
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<ToolExecutionResult>;
}

export type ToolExecutionResult =
  | {
      type: "image";
      mode: "generate" | "search";
      images: ImageResultItem[];
      text: string;
      rawResult?: unknown;
    }
  | {
      type: "sources";
      sources: SearchResult[];
      text?: string;
      rawResult?: unknown;
    }
  | {
      type: "audio";
      url?: string;
      text: string;
      rawResult?: unknown;
    }
  | {
      type: "video";
      url?: string;
      text: string;
      rawResult?: unknown;
    }
  | {
      type: "text";
      text: string;
      rawResult?: unknown;
    }
  | {
      type: "error";
      error: string;
      providerError?: boolean;
    };

/**
 * Standard JSON schema tool declarations passed to Ollama/OpenAI
 */
export const OLLAMA_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "image_generation",
      description:
        "Generates a high-quality AI image or artwork based on a textual prompt. Use this whenever the user asks to generate, create, draw, paint, or render an image, artwork, illustration, or photo.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Detailed description of the image to generate.",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description:
        "Searches the real-time internet for latest news, facts, current events, live scores, recent releases, or specific web information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string to search the web.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculator",
      description:
        "Accurately computes complex mathematical, arithmetic, and scientific calculations.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "Mathematical expression to evaluate (e.g. '4539 * 284.23 + sqrt(984)').",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "text_to_speech",
      description:
        "Converts text into spoken audio. Use when the user asks to speak out text, listen to audio, or voice an answer.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to convert to speech audio.",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "video_generation",
      description:
        "Generates a short AI video animation from a text prompt or idea.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Description of the video to create.",
          },
        },
        required: ["prompt"],
      },
    },
  },
];

/**
 * Registry of canonical tools and their executors
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  image_generation: {
    name: "image_generation",
    aliases: [
      "dalle.text2im",
      "image.generate",
      "generate_image",
      "text2im",
      "text_to_image",
      "dall-e",
      "dall-e-3",
      "flux",
      "dalle",
      "create_image",
    ],
    description: "Generates an AI image based on a prompt.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt describing the image" },
      },
      required: ["prompt"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
      const prompt =
        typeof args.prompt === "string"
          ? args.prompt
          : typeof args.text === "string"
          ? args.text
          : typeof args.description === "string"
          ? args.description
          : typeof args.input === "string"
          ? args.input
          : "";

      if (!prompt.trim()) {
        return {
          type: "error",
          error: "Image generation requires a prompt.",
        };
      }

      try {
        const imageResult = await generateAiImage(prompt);
        const caption = `Here is your generated image of **${prompt}**:`;
        const markdown = `${caption}\n\n![${prompt}](${imageResult.url})\n\n`;

        return {
          type: "image",
          mode: "generate",
          images: [imageResult],
          text: markdown,
          rawResult: imageResult,
        };
      } catch (err) {
        console.error("Tool execution failed: image_generation", err);
        return {
          type: "error",
          error: `Image generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    },
  },

  web_search: {
    name: "web_search",
    aliases: [
      "google_search",
      "search",
      "web.search",
      "web_lookup",
      "browser.search",
      "internet_search",
      "ddg_search",
    ],
    description: "Searches the web for real-time information.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
      const query =
        typeof args.query === "string"
          ? args.query
          : typeof args.q === "string"
          ? args.q
          : typeof args.searchQuery === "string"
          ? args.searchQuery
          : typeof args.input === "string"
          ? args.input
          : "";

      if (!query.trim()) {
        return {
          type: "error",
          error: "Web search requires a query.",
        };
      }

      try {
        const searchRes: WebSearchResponse = await performWebSearch(query, 5);
        const sources = searchRes.results || [];
        const summaryText = sources
          .map((s, idx) => `[${idx + 1}] **${s.title}**: ${s.snippet} (${s.url})`)
          .join("\n\n");

        return {
          type: "sources",
          sources,
          text: summaryText,
          rawResult: searchRes,
        };
      } catch (err) {
        console.error("Tool execution failed: web_search", err);
        return {
          type: "error",
          error: `Web search failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        };
      }
    },
  },

  calculator: {
    name: "calculator",
    aliases: ["calc", "math_eval", "math", "calculate", "python", "code_interpreter"],
    description: "Evaluates mathematical expressions safely.",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Math expression to evaluate" },
      },
      required: ["expression"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
      const expr =
        typeof args.expression === "string"
          ? args.expression
          : typeof args.expr === "string"
          ? args.expr
          : typeof args.code === "string"
          ? args.code
          : typeof args.input === "string"
          ? args.input
          : "";

      if (!expr.trim()) {
        return { type: "error", error: "Calculator requires a mathematical expression." };
      }

      try {
        const result = safeEvaluateMath(expr);
        return {
          type: "text",
          text: `**Result:** \`${result}\`\n\n*(Calculation: \`${expr.trim()} = ${result}\`)*`,
          rawResult: { expression: expr, result },
        };
      } catch (err) {
        return {
          type: "error",
          error: `Calculation error: ${err instanceof Error ? err.message : "Could not evaluate expression"}`,
        };
      }
    },
  },

  text_to_speech: {
    name: "text_to_speech",
    aliases: ["tts", "speech", "speak", "audio.generate", "generate_speech", "voice"],
    description: "Converts text to spoken audio.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to voice" },
      },
      required: ["text"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
      const textToVoice =
        typeof args.text === "string"
          ? args.text
          : typeof args.content === "string"
          ? args.content
          : typeof args.input === "string"
          ? args.input
          : "";

      if (!textToVoice.trim()) {
        return { type: "error", error: "Text-to-speech requires text." };
      }

      // 1. Check if OpenAI API key is configured for high-quality TTS
      const openAiKey = process.env.OPENAI_API_KEY;
      if (openAiKey && openAiKey.startsWith("sk-")) {
        try {
          const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAiKey}`,
            },
            body: JSON.stringify({
              model: "tts-1",
              input: textToVoice.slice(0, 1000),
              voice: "alloy",
            }),
          });

          if (ttsRes.ok) {
            const buffer = await ttsRes.arrayBuffer();
            const base64Audio = Buffer.from(buffer).toString("base64");
            const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
            return {
              type: "audio",
              url: audioUrl,
              text: `🔊 **Audio ready:** Listen to the spoken response:\n\n<audio controls src="${audioUrl}" style="width: 100%; margin-top: 8px;"></audio>`,
              rawResult: { text: textToVoice },
            };
          }
        } catch (openAiErr) {
          console.warn("OpenAI TTS failed:", openAiErr);
        }
      }

      // 2. Clear provider configuration message (using browser Web Speech API ready response)
      return {
        type: "audio",
        text: `🔊 **Spoken Text:**\n\n> "${textToVoice}"\n\n*(Note: You can click the **speaker icon (🔊)** on any message to hear it read aloud using your browser's native speech synthesis engine. For server-side MP3 generation, set \`OPENAI_API_KEY\` in \`.env\`.)*`,
        rawResult: { text: textToVoice, method: "browser_speech" },
      };
    },
  },

  video_generation: {
    name: "video_generation",
    aliases: [
      "text2video",
      "video.generate",
      "generate_video",
      "create_video",
      "image2video",
      "make_video",
      "video",
      "video_generator",
      "replicate.video",
      "replicate_video",
      "animate_diff",
      "animatediff",
      "t2v",
    ],
    description: "Generates an AI video from a text prompt.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Prompt describing the video to generate" },
      },
      required: ["prompt"],
    },
    execute: async (args: Record<string, unknown>): Promise<ToolExecutionResult> => {
      const prompt =
        typeof args.prompt === "string"
          ? args.prompt
          : typeof args.text === "string"
          ? args.text
          : typeof args.input === "string"
          ? args.input
          : "";

      if (!prompt.trim()) {
        return {
          type: "error",
          error: "⚠️ Please specify what video you would like to create (e.g., *\"Generate a 5 second video of a futuristic purple sports car\"*).",
        };
      }

      // Check for Replicate API token strictly from environment variables
      const token = process.env.REPLICATE_API_TOKEN?.trim().replace(/^["']|["']$/g, "");

      if (!token) {
        return {
          type: "error",
          providerError: true,
          error:
            "⚠️ **Video Generation Provider Required**\n\n" +
            `To generate videos for prompts like "*${prompt}*", a Replicate API token is required.\n\n` +
            "Please configure `REPLICATE_API_TOKEN` in your environment variables (`.env` locally or in Vercel Project Settings).\n\n" +
            "GENZ-AI currently supports real-time **Image Generation** (powered by FLUX & DALL-E 3) with zero API keys required!",
        };
      }

      try {
        // Create prediction on Replicate using AnimateDiff model
        const createRes = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "wait=60",
          },
          body: JSON.stringify({
            version: "beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
            input: {
              prompt: prompt.trim(),
            },
          }),
        });

        if (!createRes.ok) {
          interface ReplicateErrorPayload {
            title?: string;
            detail?: string;
          }
          const errData: ReplicateErrorPayload = await createRes.json().catch(() => ({}));
          const errMsg = errData.detail || errData.title || createRes.statusText;

          if (createRes.status === 402) {
            return {
              type: "error",
              providerError: true,
              error:
                "⚠️ **Replicate Credit Required**\n\n" +
                `Your Replicate account requires credit to run video models: *${errMsg}*\n\n` +
                "Please visit [Replicate Billing](https://replicate.com/account/billing) to add credits to your account.",
            };
          }

          if (createRes.status === 401) {
            return {
              type: "error",
              providerError: true,
              error:
                "⚠️ **Invalid Replicate Token**\n\nThe configured `REPLICATE_API_TOKEN` was rejected by the Replicate API. Please verify your token in `.env`.",
            };
          }

          return {
            type: "error",
            error: `Replicate video generation request failed: ${errMsg} (HTTP ${createRes.status})`,
          };
        }

        interface ReplicatePrediction {
          id: string;
          status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
          output?: string | string[];
          error?: string;
        }

        let prediction: ReplicatePrediction = await createRes.json();

        // If not completed synchronously, poll up to 60s
        const maxPolls = 20;
        let polls = 0;
        while (
          (prediction.status === "starting" || prediction.status === "processing") &&
          polls < maxPolls
        ) {
          await new Promise((r) => setTimeout(r, 3000));
          polls++;
          const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (pollRes.ok) {
            prediction = await pollRes.json();
          }
        }

        if (prediction.status === "succeeded" && prediction.output) {
          const videoUrl = Array.isArray(prediction.output)
            ? prediction.output[0]
            : String(prediction.output);

          const caption = `Here is your generated video for **${prompt}**:`;
          const videoMarkdown =
            `${caption}\n\n` +
            `<video controls src="${videoUrl}" style="max-width: 100%; border-radius: 12px; margin: 12px 0; background: #000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>\n\n` +
            `[📥 Download Video MP4](${videoUrl})`;

          return {
            type: "video",
            url: videoUrl,
            text: videoMarkdown,
            rawResult: prediction,
          };
        }

        if (prediction.status === "failed") {
          return {
            type: "error",
            error: `Replicate video generation failed: ${prediction.error || "Model processing error"}`,
          };
        }

        if (prediction.status === "starting" || prediction.status === "processing") {
          return {
            type: "text",
            text:
              `🎬 **Video rendering on Replicate!**\n\n` +
              `Your video for **"${prompt}"** is currently rendering (Prediction ID: \`${prediction.id}\`).\n\n` +
              `You can monitor the output directly at [Replicate Prediction](https://replicate.com/p/${prediction.id}).`,
          };
        }

        return {
          type: "error",
          error: `Unexpected prediction status from Replicate: ${prediction.status}`,
        };
      } catch (repErr) {
        console.error("Replicate video generation error:", repErr);
        return {
          type: "error",
          error: `Failed to connect to Replicate video service: ${repErr instanceof Error ? repErr.message : "Unknown error"}`,
        };
      }
    },
  },
};

/**
 * Builds an alias lookup map for O(1) canonical tool resolution
 */
const TOOL_ALIAS_MAP: Map<string, ToolDefinition> = new Map();

for (const tool of Object.values(TOOL_REGISTRY)) {
  TOOL_ALIAS_MAP.set(tool.name.toLowerCase(), tool);
  for (const alias of tool.aliases) {
    TOOL_ALIAS_MAP.set(alias.toLowerCase(), tool);
  }
}

/**
 * Resolves any tool name or alias to its canonical ToolDefinition
 */
export function resolveTool(name: string): ToolDefinition | undefined {
  if (!name) return undefined;
  const clean = name.trim().toLowerCase();

  // 1. Direct exact alias match
  const directMatch = TOOL_ALIAS_MAP.get(clean);
  if (directMatch) return directMatch;

  // 2. Fuzzy categorization fallback for diverse model naming conventions
  if (clean.includes("video") || clean.includes("anim") || clean.includes("diff") || clean.includes("t2v")) {
    return TOOL_REGISTRY.video_generation;
  }
  if (
    clean.includes("dall") ||
    clean.includes("image") ||
    clean.includes("img") ||
    clean.includes("photo") ||
    clean.includes("pic") ||
    clean.includes("flux") ||
    clean.includes("text2im")
  ) {
    return TOOL_REGISTRY.image_generation;
  }
  if (clean.includes("search") || clean.includes("lookup") || clean.includes("google") || clean.includes("web") || clean.includes("browse")) {
    return TOOL_REGISTRY.web_search;
  }
  if (clean.includes("calc") || clean.includes("math") || clean.includes("eval")) {
    return TOOL_REGISTRY.calculator;
  }
  if (clean.includes("speech") || clean.includes("tts") || clean.includes("audio") || clean.includes("voice")) {
    return TOOL_REGISTRY.text_to_speech;
  }

  return undefined;
}

/**
 * Safely evaluates arithmetic expressions without using raw eval()
 */
function safeEvaluateMath(expression: string): number {
  const sanitized = expression
    .trim()
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**")
    .replace(/\bsqrt\s*\(([^)]+)\)/gi, "Math.sqrt($1)")
    .replace(/\babs\s*\(([^)]+)\)/gi, "Math.abs($1)")
    .replace(/\bround\s*\(([^)]+)\)/gi, "Math.round($1)")
    .replace(/\bfloor\s*\(([^)]+)\)/gi, "Math.floor($1)")
    .replace(/\bceil\s*\(([^)]+)\)/gi, "Math.ceil($1)")
    .replace(/\bsin\s*\(([^)]+)\)/gi, "Math.sin($1)")
    .replace(/\bcos\s*\(([^)]+)\)/gi, "Math.cos($1)")
    .replace(/\btan\s*\(([^)]+)\)/gi, "Math.tan($1)")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/gi, "Math.E");

  if (!/^[\d\s+\-*/().,%Math.sqrtabsondeceilPIE]+$/.test(sanitized)) {
    throw new Error("Invalid mathematical expression.");
  }

  const fn = new Function(`"use strict"; return (${sanitized});`);
  const val = fn();

  if (typeof val !== "number" || isNaN(val)) {
    throw new Error("Evaluation did not return a valid number.");
  }

  return Number(val.toFixed(6).replace(/\.?0+$/, ""));
}
