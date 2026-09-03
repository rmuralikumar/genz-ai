"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Copy, Check, RotateCcw, FileText, Image as ImageIcon } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { CodeBlock } from "./CodeBlock";

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onEdit?: (content: string) => void;
}

export function MessageItem({
  message,
  isLastAssistant,
  onRegenerate,
  onEdit,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? "bg-transparent flex justify-end"
          : "bg-[var(--bot-msg-bg)]/40 border-y border-[var(--border-subtle)] flex justify-start"
      }`}
    >
      <div
        className={`w-full max-w-3xl flex gap-3.5 ${
          isUser ? "flex-row-reverse max-w-2xl" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className={`flex-1 min-w-0 ${isUser ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-2 mb-1.5 select-none">
            <span className="text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
              {isUser ? "You" : "GENZ-AI"}
            </span>
            {message.model && !isUser && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-glow)] text-[var(--accent-primary)] font-medium">
                {message.model}
              </span>
            )}
          </div>

          {/* Attachments if present */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
                >
                  {att.mimeType.startsWith("image/") ? (
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="truncate max-w-[150px]">{att.filename}</span>
                </div>
              ))}
            </div>
          )}

          {/* Text Bubble / Markdown */}
          {isUser ? (
            <div className="inline-block text-left p-3.5 rounded-2xl bg-[var(--user-msg-bg)] text-[var(--user-msg-text)] shadow-sm text-[14.5px] leading-relaxed break-words max-w-full">
              {message.content}
            </div>
          ) : (
            <div className="prose-genz break-words w-full">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre({ children }) {
                    return <>{children}</>;
                  },
                  code({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match && !String(children).includes("\n");
                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <CodeBlock
                        language={match ? match[1] : "text"}
                        value={String(children).replace(/\n$/, "")}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Action Toolbar */}
          <div
            className={`flex items-center gap-1 mt-2 text-[var(--text-muted)] ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <button
              onClick={handleCopy}
              type="button"
              title="Copy message"
              aria-label={copied ? "Copied" : "Copy message"}
              className="p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                type="button"
                title="Regenerate response"
                aria-label="Regenerate response"
                className="p-1.5 rounded-md hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {isUser && onEdit && (
              <button
                onClick={() => onEdit(message.content)}
                type="button"
                title="Edit message"
                aria-label="Edit message"
                className="text-xs px-1.5 py-1 rounded hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
