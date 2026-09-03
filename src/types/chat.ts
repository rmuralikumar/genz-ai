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

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
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
