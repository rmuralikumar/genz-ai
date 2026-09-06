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
  Bot,
} from "lucide-react";
import { ChatMessage, ChatStatus, ChatErrorInfo } from "@/types/chat";
import { getModelConfig } from "@/lib/ai/models";
import { detectImageIntent } from "@/lib/ai/image";
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
  currentModel?: string;
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
  currentModel,
}: MessageListProps) {
  const activeModelConfig = getModelConfig(currentModel);
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
        /* Minimalist Retro-Futuristic Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto select-none pt-8 sm:pt-12">
          {/* Glowing Emblem */}
          <div className="relative mb-5 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(0,240,255,0.35)] border border-cyan-400/50 ring-1 ring-purple-500/40">
              <Sparkles className="w-7 h-7 text-cyan-200 drop-shadow-[0_0_8px_#00f0ff]" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 blur-md -z-10 group-hover:opacity-100 transition-opacity" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-widest bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300 bg-clip-text text-transparent uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.2)] mb-1">
            GENZ-AI NEURAL MATRIX
          </h2>
          <p className="text-xs font-mono text-cyan-400/70 tracking-wider max-w-md mb-8">
            QUANTUM REASONING // HIGH-CONCURRENCY STREAMING
          </p>

          {/* Starter Directives Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
            {STARTER_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectStarter?.(item.prompt)}
                  type="button"
                  className="p-3.5 rounded-2xl bg-[#090d1c]/80 hover:bg-[#0f142b] border border-purple-500/25 hover:border-cyan-400/60 transition-all duration-200 text-left group shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2 rounded-xl bg-purple-950/50 border border-purple-500/30 w-fit mb-3 text-cyan-400 group-hover:text-cyan-200 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-xs text-slate-200 group-hover:text-white mb-1 tracking-wide">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
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

          {/* Smooth In-Stream Typing Indicator */}
          {(status === "submitting" || (status === "streaming" && !streamingContent)) && (() => {
            const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
            const imageIntent = lastUserMsg ? detectImageIntent(lastUserMsg.content) : null;
            const isImageSearch =
              (imageIntent?.isImageRequest && imageIntent.mode === "search") ||
              streamingContent.includes("Finding photos");
            const isImageGen =
              (imageIntent?.isImageRequest && imageIntent.mode === "generate") ||
              streamingContent.includes("Generating image");

            let badgeLabel = activeModelConfig.name;
            let statusLabel = "Processing neural directives...";

            if (isImageSearch) {
              badgeLabel = "Photo Search";
              statusLabel = "Searching archives...";
            } else if (isImageGen) {
              badgeLabel = "Image Studio";
              statusLabel = "Synthesizing visual matrix...";
            }

            return (
              <div className="py-4 sm:py-5 px-3 sm:px-4 md:px-6 bg-[#070915]/50 border-y border-purple-500/15 flex justify-start animate-in fade-in duration-200">
                <div className="w-full max-w-3xl mx-auto flex gap-3 sm:gap-3.5 flex-row justify-start">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-black border border-purple-500/40 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.35)] flex items-center justify-center shrink-0 select-none">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                    <div className="flex items-center gap-2 mb-2 select-none flex-wrap">
                      <span className="text-xs font-semibold tracking-wider text-slate-200">
                        GENZ-AI
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-[0_0_6px_rgba(0,240,255,0.2)]">
                        <span>{badgeLabel}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 py-1 text-slate-400 text-sm font-mono">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7] animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-bounce" />
                      <span className="ml-2 text-xs text-cyan-300/80">
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Active Streaming Message */}
          {status === "streaming" && streamingContent && (
            <MessageItem
              message={{
                id: "streaming-temp-msg",
                conversationId: "temp",
                role: "assistant",
                content: streamingContent,
                model: currentModel,
                createdAt: new Date(),
              }}
            />
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
          className="sticky bottom-4 self-center p-2 rounded-full bg-[#0a0d1e]/90 hover:bg-[#121832] text-cyan-400 hover:text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all hover:scale-105 active:scale-95 focus:outline-none z-20"
        >
          <ArrowDown className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
