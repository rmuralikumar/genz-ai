import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(100).optional(),
  model: z.string().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(100).optional(),
  isArchived: z.boolean().optional(),
});

export const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().max(25 * 1024 * 1024, "File size limit is 25MB"),
  url: z.string().min(1),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
  model: z.string().optional(),
  attachments: z.array(attachmentSchema).optional(),
  isRetry: z.boolean().optional(),
});

export const userSettingsSchema = z.object({
  theme: z.enum(["dark", "light", "system"]).optional(),
  defaultModel: z.string().optional(),
  enterToSend: z.boolean().optional(),
  autoScroll: z.boolean().optional(),
  compactMode: z.boolean().optional(),
});
