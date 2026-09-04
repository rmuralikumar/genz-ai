export type ChatStatus =
  | "idle"
  | "submitting"
  | "streaming"
  | "completed"
  | "error"
  | "stopped";

export interface ChatErrorInfo {
  code: string;
  message: string;
  failedContent?: string;
  failedAttachments?: AttachmentItem[];
}

export interface AttachmentItem {
  id?: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ImageItem {
  url: string;
  thumbnail?: string;
  title: string;
  source: string;
  author?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface SearchSource {
  id: number;
  title: string;
  url: string;
  snippet?: string;
  source?: string;
}

export interface ResearchStep {
  step: number;
  total: number;
  title: string;
  status: "pending" | "in-progress" | "completed";
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "image" | "search" | "research" | "file";
  images?: ImageItem[];
  sources?: SearchSource[];
  researchSteps?: ResearchStep[];
  audioUrl?: string;
  model?: string | null;
  tokensUsed?: number | null;
  createdAt: string | Date;
  attachments?: AttachmentItem[];
}

export interface ConversationItem {
  id: string;
  title: string;
  userId: string;
  model: string;
  isArchived: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string | Date;
  settings?: UserSettings | null;
}

export interface UserSettings {
  id?: string;
  userId?: string;
  theme: "dark" | "light" | "system";
  defaultModel: string;
  enterToSend: boolean;
  autoScroll: boolean;
  compactMode: boolean;
}
