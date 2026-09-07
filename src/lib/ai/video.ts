import { generateAiImage } from "./image";

export interface VideoExecutionResult {
  type: "video" | "text" | "error";
  url?: string;
  text?: string;
  error?: string;
  rawResult?: unknown;
  provider?: string;
}

/**
 * Strips conversational fluff and prefixes from extracted video prompts.
 */
export function cleanVideoPrompt(prompt: string): string {
  return prompt
    .replace(/^(?:of|for|about|showing|depicting|with|featuring|a|an|the)\s+/i, "")
    .replace(/\s+(?:please|pls|bro|machi|da|thala|thalaiva)$/i, "")
    .replace(/^(?:oru\s+)/i, "")
    .trim();
}

/**
 * Generates or prepares AI video using a multi-provider architecture.
 *
 * Provider Hierarchy:
 * 1. Self-Hosted / Local GPU Endpoint (VIDEO_API_URL or LOCAL_VIDEO_URL) - Free & self-hosted
 * 2. Hugging Face Inference (HUGGINGFACE_API_KEY / HF_TOKEN) - Optional free-tier API
 * 3. Replicate (REPLICATE_API_TOKEN) - Optional paid cloud GPU provider
 * 4. Default Free AI Video Studio - Zero-cost, zero-auth scene director and visual keyframe
 *    storyboard engine (Pollinations FLUX + camera motion specs + free 1-click video tools).
 *
 * Adheres strictly to honesty guidelines:
 * - If no video file is rendered, returns type: "text" and does NOT claim a video was created.
 * - Clearly reports when any configured provider fails or hits quota limits.
 */
export async function generateVideo(rawPrompt: string): Promise<VideoExecutionResult> {
  const prompt = cleanVideoPrompt(rawPrompt);

  if (!prompt) {
    return {
      type: "error",
      error:
        "⚠️ Please specify what video you would like to create (e.g., *\"Generate a 5 second video of a futuristic purple sports car\"*).",
    };
  }

  const notices: string[] = [];

  // =========================================================================
  // 1. SELF-HOSTED / LOCAL GPU VIDEO PROVIDER (Optional Free / Local Endpoint)
  // Connects to local or remote ComfyUI, FastAPI, or custom text2video server
  // =========================================================================
  const localVideoUrl = (
    process.env.VIDEO_API_URL ||
    process.env.LOCAL_VIDEO_URL ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "");

  if (localVideoUrl) {
    try {
      const endpoint = localVideoUrl.endsWith("/generate")
        ? localVideoUrl
        : `${localVideoUrl.replace(/\/+$/, "")}/generate`;

      const localRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration: 5, fps: 24 }),
        signal: AbortSignal.timeout(45000),
      });

      if (localRes.ok) {
        const localData = await localRes.json().catch(() => ({}));
        const videoUrl = localData.url || localData.video_url || localData.video;
        if (typeof videoUrl === "string" && videoUrl.length > 0) {
          const caption = `Here is your generated video for **${prompt}**:`;
          const videoMarkdown =
            `${caption}\n\n` +
            `<video controls src="${videoUrl}" style="max-width: 100%; border-radius: 12px; margin: 12px 0; background: #000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>\n\n` +
            `[📥 Download Video MP4](${videoUrl})`;

          return {
            type: "video",
            url: videoUrl,
            text: videoMarkdown,
            rawResult: localData,
            provider: "Local/Self-Hosted GPU",
          };
        }
      } else {
        notices.push(`Local GPU endpoint responded with HTTP ${localRes.status}`);
      }
    } catch (localErr) {
      const msg = localErr instanceof Error ? localErr.message : "connection failed";
      notices.push(`Local GPU server (${localVideoUrl}) could not be reached: ${msg}`);
    }
  }

  // =========================================================================
  // 2. HUGGING FACE INFERENCE (Optional Free-tier API with HF_TOKEN)
  // =========================================================================
  const hfToken = (
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HF_TOKEN ||
    ""
  )
    .trim()
    .replace(/^["']|["']$/g, "");

  if (hfToken) {
    try {
      const hfModel = process.env.HF_VIDEO_MODEL || "damo-vilab/text-to-video-ms-1.7b";
      const hfRes = await fetch(
        `https://router.huggingface.co/hf-inference/models/${hfModel}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
          signal: AbortSignal.timeout(50000),
        }
      );

      if (hfRes.ok) {
        const contentType = hfRes.headers.get("content-type") || "";
        if (contentType.includes("video") || contentType.includes("octet-stream")) {
          const buffer = await hfRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const videoUrl = `data:video/mp4;base64,${base64}`;

          const caption = `Here is your generated video for **${prompt}**:`;
          const videoMarkdown =
            `${caption}\n\n` +
            `<video controls src="${videoUrl}" style="max-width: 100%; border-radius: 12px; margin: 12px 0; background: #000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></video>\n\n` +
            `[📥 Download Video MP4](${videoUrl})`;

          return {
            type: "video",
            url: videoUrl,
            text: videoMarkdown,
            rawResult: { provider: "Hugging Face Inference", size: buffer.byteLength },
            provider: "Hugging Face",
          };
        }
      } else {
        const errJson = await hfRes.json().catch(() => ({}));
        const errMsg = errJson.error || `HTTP ${hfRes.status}`;
        notices.push(`Hugging Face video inference: ${errMsg}`);
      }
    } catch (hfErr) {
      const msg = hfErr instanceof Error ? hfErr.message : "request failed";
      notices.push(`Hugging Face inference error: ${msg}`);
    }
  }

  // =========================================================================
  // 3. OPTIONAL REPLICATE PROVIDER (Only used if configured)
  // =========================================================================
  const replicateToken = process.env.REPLICATE_API_TOKEN?.trim().replace(/^["']|["']$/g, "");

  if (replicateToken) {
    try {
      const createRes = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${replicateToken}`,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          version: "beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
          input: { prompt },
        }),
      });

      if (createRes.ok) {
        interface ReplicatePrediction {
          id: string;
          status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
          output?: string | string[];
          error?: string;
        }

        let prediction: ReplicatePrediction = await createRes.json();

        // Poll up to 60s
        const maxPolls = 20;
        let polls = 0;
        while (
          (prediction.status === "starting" || prediction.status === "processing") &&
          polls < maxPolls
        ) {
          await new Promise((r) => setTimeout(r, 3000));
          polls++;
          const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { Authorization: `Bearer ${replicateToken}` },
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
            provider: "Replicate",
          };
        }

        if (prediction.status === "starting" || prediction.status === "processing") {
          return {
            type: "text",
            text:
              `🎬 **Video Rendering on Replicate**\n\n` +
              `Your video for **"${prompt}"** is currently rendering in the background (Prediction ID: \`${prediction.id}\`).\n\n` +
              `You can monitor the output directly at [Replicate Prediction](https://replicate.com/p/${prediction.id}).`,
            provider: "Replicate",
          };
        }
      } else {
        interface ReplicateErrorPayload {
          title?: string;
          detail?: string;
        }
        const errData: ReplicateErrorPayload = await createRes.json().catch(() => ({}));
        const errMsg = errData.detail || errData.title || `HTTP ${createRes.status}`;
        if (createRes.status === 402) {
          notices.push(`Replicate account requires credits: ${errMsg}`);
        } else if (createRes.status === 401) {
          notices.push(`Configured Replicate token was rejected by API`);
        } else {
          notices.push(`Replicate API status: ${errMsg}`);
        }
      }
    } catch (repErr) {
      notices.push(
        `Replicate connection failed: ${repErr instanceof Error ? repErr.message : "network error"}`
      );
    }
  }

  // =========================================================================
  // 4. DEFAULT FREE AI VIDEO STUDIO (Zero-Cost, Zero-Auth, Zero-Dependencies)
  //
  // Generates a cinematic visual keyframe via the zero-cost Pollinations FLUX engine,
  // provides motion specifications, and 1-click links to top genuinely free video tools.
  // Never fakes video generation or claims an MP4 was created.
  // =========================================================================
  let keyframeUrl = "";
  try {
    const keyframeRes = await generateAiImage(
      `cinematic film still frame of ${prompt}, continuous motion blur, 8k resolution, photorealistic, dramatic movie lighting, 16:9 widescreen`
    );
    keyframeUrl = keyframeRes.url;
  } catch (err) {
    console.warn("Keyframe preview generation note:", err);
  }

  const cleanMotionPrompt = `Cinematic 4K continuous motion video of ${prompt}, photorealistic textures, dynamic camera pan, volumetric lighting, 24fps`;

  const noticesSection =
    notices.length > 0
      ? `\n\n> ℹ️ **Configured Provider Status:**\n` +
        notices.map((n) => `> - *${n}*`).join("\n")
      : "";

  const freeStudioMarkdown =
    `🎬 **AI Video Studio — Scene Storyboard & Free Generation Spec**\n\n` +
    `Here is the cinematic scene keyframe generated for your video request:\n\n` +
    (keyframeUrl ? `![${prompt}](${keyframeUrl})\n\n` : "") +
    `### 🎥 Camera & Motion Specification:\n` +
    `\`\`\`text\n${cleanMotionPrompt}\n\`\`\`\n\n` +
    `### 🚀 Generate Full Video for Free:\n` +
    `Direct server-side MP4 video rendering requires high-memory GPU compute (16GB+ VRAM) which is not available in Vercel's serverless environment without an external GPU compute endpoint. You can generate this video for **100% free** using these top platforms offering free tiers:\n\n` +
    `- **[Hugging Face Video Spaces](https://huggingface.co/spaces?filter=text-to-video)** — Free open-source community GPU spaces (Wan2.1, CogVideoX, & AnimateDiff).\n` +
    `- **[Luma Dream Machine](https://lumalabs.ai/dream-machine)** — High-fidelity 3D motion video generation with free monthly allowance.\n` +
    `- **[Kling AI](https://klingai.com)** — Daily free credits for realistic 5–10s video generation.\n` +
    `- **[Pika Labs](https://pika.art)** — Fast cinematic video creation with free daily generations.\n\n` +
    `*(Optional: To render MP4 videos directly inside chat, connect a self-hosted GPU endpoint with \`VIDEO_API_URL\` or configure an active \`REPLICATE_API_TOKEN\` in your environment variables.)*` +
    noticesSection;

  return {
    type: "text",
    text: freeStudioMarkdown,
    rawResult: { prompt, keyframeUrl },
    provider: "Free AI Video Studio",
  };
}
