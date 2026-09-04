import { AttachmentItem } from "@/types/chat";
import { detectImageIntent, DetectedImageIntent } from "./image";
import { detectWebSearchIntent } from "./web_search";

export type RouteIntent =
  | "CHAT"
  | "WEB_SEARCH"
  | "IMAGE_SEARCH"
  | "IMAGE_GENERATION"
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

  // 2. Deep Research Check
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

  // 3. Image Search & Generation Intent
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

  // 4. Real Web Search Intent
  const searchIntent = detectWebSearchIntent(trimmed);
  if (searchIntent.isSearch) {
    return {
      intent: "WEB_SEARCH",
      targetQuery: searchIntent.searchQuery,
      searchQuery: searchIntent.searchQuery,
    };
  }

  // 5. Default General Chat
  return {
    intent: "CHAT",
    targetQuery: trimmed,
  };
}
