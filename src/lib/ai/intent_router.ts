import { AttachmentItem } from "@/types/chat";
import { detectImageIntent, DetectedImageIntent } from "./image";
import { detectWebSearchIntent } from "./web_search";

export type RouteIntent =
  | "CHAT"
  | "WEB_SEARCH"
  | "IMAGE_SEARCH"
  | "IMAGE_GENERATION"
  | "VIDEO_GENERATION"
  | "IMAGE_ANALYSIS"
  | "FILE_ANALYSIS"
  | "DEEP_RESEARCH";

export interface IntentResolution {
  intent: RouteIntent;
  targetQuery: string;
  imageIntent?: DetectedImageIntent;
  searchQuery?: string;
  attachments?: AttachmentItem[];
}

/**
 * Strips conversational fluff and prefixes from extracted video prompts.
 */
function cleanVideoPromptString(str: string): string {
  return str
    .replace(/^(?:of|for|about|showing|depicting|with|featuring|a|an|the)\s+/i, "")
    .replace(/\s+(?:please|pls|bro|machi|da|thala|thalaiva)$/i, "")
    .replace(/^(?:oru\s+)/i, "")
    .trim();
}

/**
 * Detects if a message is explicitly requesting video generation.
 * Handles "generate a 5 second video of...", "make a video", "text to video", "create a video", etc.
 */
export function detectVideoIntent(input: string): { isVideo: boolean; prompt: string } {
  if (!input) return { isVideo: false, prompt: "" };
  const raw = input.trim();
  if (raw.length < 3) return { isVideo: false, prompt: "" };

  // Negative guards: programming questions, tutorials, explanations about video code/tools
  if (
    /^(?:how\s+to|what\s+is|why\s+|explain\s+|difference\s+between|can\s+you\s+explain|steps\s+to|documentation\s+for)\b/i.test(raw) ||
    /\b(?:<video|video\s+tag|video\s+element|react-player|video\.js|ffmpeg|mp4\s+format|h264|codec)\b/i.test(raw)
  ) {
    return { isVideo: false, prompt: "" };
  }

  // 1. Explicit duration / qualifiers with video and a subject prompt
  // e.g. "Generate a 5 second video of a futuristic purple sports car"
  // e.g. "make a 10s video of sunrise over ocean"
  // e.g. "create a video of a golden retriever"
  // e.g. "5 second video of a futuristic purple sports car"
  const videoWithPromptPatterns = [
    // generate / create / make / render (me)? (a)? (5 second / 10s)? (short)? video (of/for/about)? PROMPT
    /^(?:can\s+you\s+|could\s+you\s+|would\s+you\s+|please\s+)?(?:generate|create|make|render|produce|shoot|build)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:\d+[\s-]*(?:seconds?|secs?|s|minutes?|mins?)\s+)?(?:short|quick|cool|cinematic|hd|realistic|animated|ai)?\s*(?:video|clip|animation|mp4|reel)s?\s*(?:of|for|about|showing|with|depicting|featuring)?\s*(.*)$/i,

    // (5 second / 10s)? video of / showing PROMPT
    /^(?:can\s+you\s+|could\s+you\s+|please\s+)?(?:an?|the|some)?\s*(?:\d+[\s-]*(?:seconds?|secs?|s|minutes?|mins?)\s+)?(?:short|quick|cool|cinematic|hd|realistic|animated|ai)?\s*(?:video|clip|animation|mp4|reel)s?\s+(?:of|for|about|showing|with|depicting|featuring)\s+(.+)$/i,

    // I want / I need a (5 second)? video of PROMPT
    /^(?:i\s+want|i\s+need|can\s+i\s+have|give\s+me)\s+(?:an?|the|some)?\s*(?:\d+[\s-]*(?:seconds?|secs?|s|minutes?|mins?)\s+)?(?:short|quick|cool|cinematic|hd|realistic|animated|ai)?\s*(?:video|clip|animation|mp4|reel)s?\s+(?:of|for|about|showing|with)\s+(.+)$/i,

    // text to video: PROMPT
    /^(?:text\s*to\s*video|text2video|t2v|video\s+generation)\s*(?:[:\-–]\s*|\s+(?:of|for|about|showing)?\s*)(.+)$/i,

    // Tanglish: [subject] video create pannu / generate pannu / podu
    /^(.+?)\s+(?:video|clip|animation)\s*(?:create\s+pannu|generate\s+pannu|podu|kattunga|pannu)/i,

    // generate [subject] video
    /^(?:can\s+you\s+|please\s+)?(?:generate|create|make|render)\s+(.+?)\s+(?:video|clip|animation|mp4)$/i,
  ];

  for (const pattern of videoWithPromptPatterns) {
    const match = raw.match(pattern);
    if (match) {
      const extracted = (match[1] || "").trim();
      const cleaned = cleanVideoPromptString(extracted);
      if (cleaned.length >= 2) {
        return { isVideo: true, prompt: cleaned };
      }
    }
  }

  // 2. Direct intent triggers without a specific subject (e.g. "generate a video", "make a video", "5 second video", "text to video", "create a video")
  const directTriggers = [
    /^(?:can\s+you\s+|could\s+you\s+|please\s+)?(?:generate|create|make|render|produce)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:\d+[\s-]*(?:seconds?|secs?|s)\s+)?(?:short\s+)?(?:video|clip|animation|mp4)$/i,
    /^(?:an?|the)?\s*(?:\d+[\s-]*(?:seconds?|secs?|s)\s+)?(?:short\s+)?(?:video|clip|animation|mp4)$/i,
    /^(?:text\s*to\s*video|text2video|t2v|video\s+generation)$/i,
  ];

  for (const trigger of directTriggers) {
    if (trigger.test(raw)) {
      return { isVideo: true, prompt: "" };
    }
  }

  // 3. Fallback: query explicitly contains both a creation verb AND a video keyword
  const hasCreationVerb = /\b(?:generate|create|make|render|produce)\b/i.test(raw);
  const hasVideoKeyword = /\b(?:video|clip|animation|mp4)\b/i.test(raw);
  if (hasCreationVerb && hasVideoKeyword) {
    const afterVideo = raw.match(/\b(?:video|clip|animation|mp4)s?\s+(?:of|for|about|showing|with)?\s*(.+)/i);
    const prompt = afterVideo ? cleanVideoPromptString(afterVideo[1]) : "";
    return { isVideo: true, prompt };
  }

  return { isVideo: false, prompt: "" };
}

/**
 * Resolves the primary intent of an incoming chat message.
 */
export function resolveIntent({
  content,
  attachments,
  modelId,
}: {
  content: string;
  attachments?: AttachmentItem[];
  modelId?: string;
}): IntentResolution {
  const trimmed = content.trim();

  // 1. Check for Attachments First
  if (attachments && attachments.length > 0) {
    const hasImageAttachment = attachments.some((a) => a.mimeType.startsWith("image/"));
    const hasDocAttachment = attachments.some((a) => !a.mimeType.startsWith("image/"));

    if (hasImageAttachment) {
      return {
        intent: "IMAGE_ANALYSIS",
        targetQuery: trimmed || "Analyze and explain this image.",
        attachments,
      };
    }

    if (hasDocAttachment) {
      return {
        intent: "FILE_ANALYSIS",
        targetQuery: trimmed || "Summarize and extract insights from this file.",
        attachments,
      };
    }
  }

  // 2. Video Generation Check
  const videoIntent = detectVideoIntent(trimmed);
  if (videoIntent.isVideo) {
    return {
      intent: "VIDEO_GENERATION",
      targetQuery: videoIntent.prompt,
    };
  }

  // 3. Deep Research Check
  const isReasoningModel = modelId === "genz-reasoning";
  const hasResearchTrigger =
    /^(deep\s+research|research|in-depth\s+analysis|investigate\s+the|deep\s+dive\s+into)\b/i.test(
      trimmed
    );

  if (hasResearchTrigger || (isReasoningModel && trimmed.length > 40 && !detectImageIntent(trimmed).isImageRequest)) {
    return {
      intent: "DEEP_RESEARCH",
      targetQuery: trimmed.replace(/^(deep\s+research|research|investigate)\s+/i, "").trim() || trimmed,
    };
  }

  // 4. Image Search & Generation Intent
  const imgIntent = detectImageIntent(trimmed);
  if (imgIntent.isImageRequest) {
    if (imgIntent.mode === "search") {
      return {
        intent: "IMAGE_SEARCH",
        targetQuery: imgIntent.prompt,
        imageIntent: imgIntent,
      };
    } else {
      return {
        intent: "IMAGE_GENERATION",
        targetQuery: imgIntent.prompt,
        imageIntent: imgIntent,
      };
    }
  }

  // 5. Real Web Search Intent
  const searchIntent = detectWebSearchIntent(trimmed);
  if (searchIntent.isSearch) {
    return {
      intent: "WEB_SEARCH",
      targetQuery: searchIntent.searchQuery,
      searchQuery: searchIntent.searchQuery,
    };
  }

  // 6. Default General Chat
  return {
    intent: "CHAT",
    targetQuery: trimmed,
  };
}
