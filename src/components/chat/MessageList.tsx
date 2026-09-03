"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Sparkles,
  Code,
  Brain,
  Compass,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { ChatMessage, ChatStatus, ChatErrorInfo } from "@/types/chat";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: ChatMessage[];
  status: ChatStatus;
  streamingContent?: string;
  errorInfo?: ChatErrorInfo | null;
  onRetry?: () => void;
  onRegenerateLast?: () => void;
  onSelectStarter?: (prompt: string) => void;
  onEditMessage?: (content: string) => void;
  autoScrollEnabled?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: Code,
    title: "Write Clean Code",
    desc: "Build a TypeScript utility with validation and tests.",
    prompt: "Write a complete TypeScript function to parse and validate JSON schemas with descriptive errors.",
  },
  {
    icon: Brain,
    title: "System Architecture",
    desc: "Design a high-concurrency event-driven service.",
    prompt: "Design a scalable event-driven notification architecture for a web app supporting millions of active users.",
  },
  {
    icon: Compass,
    title: "Brainstorm Ideas",
    desc: "Create innovative product concepts for developers.",
    prompt: "Brainstorm 5 innovative, high-impact developer tooling concepts that solve modern frontend headaches.",
  },
];

export function MessageList({
  messages,
  status,
  streamingContent = "",
  errorInfo,
  onRetry,
  onRegenerateLast,
  onSelectStarter,
  onEditMessage,
  autoScrollEnabled = true,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Track scroll position to toggle scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 150);
  };

  // Auto-scroll when messages update or streaming text streams or error appears
  useEffect(() => {
    if (autoScrollEnabled && !showScrollBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, streamingContent, status, errorInfo, autoScrollEnabled, showScrollBottom]);

  const hasMessages =
    messages.length > 0 ||
    status === "submitting" ||
    status === "streaming" ||
    status === "error";

  const getErrorTitle = (code?: string) => {
    switch (code) {
      case "AI_QUOTA_EXCEEDED":
        return "AI Account Quota Exceeded";
      case "AI_RATE_LIMITED":
        return "Rate Limit Exceeded";
      case "AI_NOT_CONFIGURED":
        return "AI Service Not Configured";
      case "AI_AUTH_ERROR":
        return "AI Service Authentication Error";
      default:
        return "AI Service Error";
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col"
    >
      {!hasMessages ? (
        /* Empty Chat State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto select-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg mb-5 shadow-indigo-500/20 ring-1 ring-white/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            How can GENZ-AI help you today?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-8">
            Experience ultra-fast streaming responses, code highlighting, reasoning, and context-aware assistance in any language.
          </p>

          {/* Starter Suggestions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full text-left">
            {STARTER_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectStarter?.(item.prompt)}
                  type="button"
                  className="p-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-all text-left group shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2 rounded-lg bg-[var(--bg-card)] w-fit mb-3 text-[var(--accent-primary)] group-hover:text-white group-hover:bg-[var(--accent-primary)] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-sm text-[var(--text-primary)] mb-1">
                      {item.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Message Feed */
        <div className="flex flex-col pb-6">
          {messages.map((msg, index) => {
            const isLastAssistant =
              msg.role === "assistant" &&
              index === messages.length - 1 &&
              status !== "streaming";

            return (
              <MessageItem
                key={msg.id || index}
                message={msg}
                isLastAssistant={isLastAssistant}
                onRegenerate={onRegenerateLast}
                onEdit={msg.role === "user" ? onEditMessage : undefined}
              />
            );
          })}

          {/* Active Streaming Message */}
          {status === "streaming" && (
            <MessageItem
              message={{
                id: "streaming-temp-msg",
                conversationId: "temp",
                role: "assistant",
                content: streamingContent || "●",
                createdAt: new Date(),
              }}
            />
          )}

          {/* Submitting Loading Indicator */}
          {status === "submitting" && (
            <div className="py-4 px-6 flex items-center gap-3 text-xs text-[var(--text-muted)] select-none">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
              <span>Contacting AI model...</span>
            </div>
          )}

          {/* True Error State Card (No fake AI responses) */}
          {status === "error" && errorInfo && (
            <div className="mx-4 md:mx-auto my-4 max-w-2xl w-full p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 shadow-lg animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  {errorInfo.code === "AI_AUTH_ERROR" || errorInfo.code === "AI_NOT_CONFIGURED" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-rose-300">
                      {getErrorTitle(errorInfo.code)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
                      {errorInfo.code}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {errorInfo.message}
                  </p>

                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold border border-rose-500/30 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom("smooth")}
          type="button"
          aria-label="Scroll to bottom"
          className="sticky bottom-4 self-center p-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
