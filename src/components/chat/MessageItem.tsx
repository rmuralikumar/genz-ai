import React, { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  User,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  AlertCircle,
  Volume2,
  VolumeX,
  Globe,
} from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { CodeBlock } from "./CodeBlock";
import { getModelConfig } from "@/lib/ai/models";

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const modelConfig = !isUser ? getModelConfig(message.model || undefined) : null;

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeechText = message.content
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*`_~]/g, "")
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message.content;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  return (
    <div
      className={`group py-3.5 sm:py-4.5 px-3 sm:px-6 transition-colors ${
        isUser
          ? "bg-transparent flex justify-end"
          : "bg-[#070914]/50 border-y border-purple-500/15 flex justify-start"
      }`}
    >
      <div
        className={`w-full max-w-3xl flex gap-3 sm:gap-3.5 ${
          isUser ? "flex-row-reverse max-w-2xl" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 ring-1 ring-purple-400/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.4)] ring-1 ring-cyan-400/50 border border-purple-500/40 bg-black flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="GENZ-AI"
                width={32}
                height={32}
                priority
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Message Content Body */}
        <div className={`flex-1 min-w-0 ${isUser ? "text-right" : "text-left"}`}>
          <div
            className={`flex items-center gap-2 mb-1.5 select-none ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <span className="text-xs font-semibold tracking-wide text-slate-300">
              {isUser ? "You" : "GENZ-AI"}
            </span>
            {!isUser && modelConfig && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 font-medium border border-cyan-500/30 shadow-[0_0_6px_rgba(0,240,255,0.2)]">
                {modelConfig.name}
              </span>
            )}
          </div>

          {/* Attachments if present */}
          {message.attachments && message.attachments.length > 0 && (
            <div
              className={`flex flex-wrap gap-2 mb-2 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c1022] border border-purple-500/30 text-xs text-slate-300 shadow-sm"
                >
                  {att.mimeType.startsWith("image/") ? (
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span className="truncate max-w-[150px] font-mono">{att.filename}</span>
                </div>
              ))}
            </div>
          )}

          {/* Text Bubble / Markdown / Structured Images */}
          {isUser ? (
            <div className="inline-block text-left px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-purple-950/80 to-purple-900/60 border border-purple-500/40 text-purple-50 shadow-[0_0_15px_rgba(168,85,247,0.18)] text-[14.5px] leading-relaxed break-words max-w-full space-y-2">
              {/* If user attached an image, render preview inside or above bubble */}
              {message.attachments && message.attachments.some((a) => a.mimeType.startsWith("image/")) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.attachments
                    .filter((a) => a.mimeType.startsWith("image/"))
                    .map((att, i) => (
                      <div key={i} className="max-w-[260px] rounded-xl overflow-hidden border border-white/10 shadow-md">
                        <img src={att.url} alt={att.filename} className="w-full h-auto object-cover max-h-[200px]" />
                      </div>
                    ))}
                </div>
              )}
              {message.content && <div>{message.content}</div>}
            </div>
          ) : (
            <div className="prose-genz break-words w-full space-y-3">
              {/* Render Citations & Sources Tray if available */}
              {message.sources && message.sources.length > 0 && (
                <div className="mb-2.5 select-none not-prose">
                  <button
                    type="button"
                    onClick={() => setShowSources((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-semibold">Sources ({message.sources.length})</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-1">
                      {showSources ? "Hide" : "View verified links"}
                    </span>
                  </button>

                  {showSources && (
                    <div className="mt-2 flex flex-wrap gap-1.5 p-2 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] shadow-inner">
                      {message.sources.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs text-[var(--accent-primary)] hover:underline truncate max-w-[260px] transition-all"
                          title={s.title}
                        >
                          <span className="font-bold text-[var(--text-muted)]">[{s.id}]</span>
                          <span className="truncate">{s.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* If message has clean text, render markdown */}
              {(() => {
                const hasStructuredImages = message.images && message.images.length > 0;
                // Strip markdown images if we have structured images to prevent duplicates
                const displayContent = hasStructuredImages
                  ? message.content.replace(/!\[.*?\]\(.*?\)/g, "").trim()
                  : message.content;

                return displayContent ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre({ children }) {
                        return <>{children}</>;
                      },
                      code({
                        className,
                        children,
                        ...props
                      }: React.ComponentPropsWithoutRef<"code">) {
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
                      p({ node, children, ...props }) {
                        const hasImage = node?.children?.some(
                          (child) => "tagName" in child && child.tagName === "img"
                        );
                        if (hasImage) {
                          return (
                            <div className="my-2 leading-relaxed" {...props}>
                              {children}
                            </div>
                          );
                        }
                        return <p {...props}>{children}</p>;
                      },
                      img({ src, alt }) {
                        const imageSrc = typeof src === "string" ? src : undefined;
                        if (!imageSrc) return null;
                        return (
                          <ImageDisplayCard
                            url={imageSrc}
                            title={alt || "Image"}
                            alt={alt || "Image"}
                            source="Visual Result"
                          />
                        );
                      },
                    }}
                  >
                    {displayContent}
                  </ReactMarkdown>
                ) : null;
              })()}

              {/* Render Structured Images */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-col gap-3 my-2">
                  {message.images.map((img, idx) => (
                    <ImageDisplayCard
                      key={idx}
                      url={img.url}
                      thumbnail={img.thumbnail}
                      title={img.title || img.alt || "Image result"}
                      source={img.source || "Photo Result"}
                      author={img.author}
                      alt={img.alt || img.title}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar - subtly appears on hover */}
          <div
            className={`flex items-center gap-1 mt-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <button
              onClick={handleCopy}
              type="button"
              title="Copy message"
              aria-label={copied ? "Copied" : "Copy message"}
              className="p-1.5 rounded-lg hover:bg-purple-950/40 hover:text-cyan-300 border border-transparent hover:border-purple-500/30 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_6px_#00f0ff]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {!isUser && (
              <button
                onClick={handleSpeak}
                type="button"
                title={isSpeaking ? "Stop speaking" : "Read message aloud"}
                aria-label={isSpeaking ? "Stop speaking" : "Read message aloud"}
                className={`p-1.5 rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  isSpeaking
                    ? "bg-purple-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)] animate-pulse"
                    : "border-transparent hover:bg-purple-950/40 hover:text-cyan-300 hover:border-purple-500/30"
                }`}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-pink-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                type="button"
                title="Regenerate response"
                aria-label="Regenerate response"
                className="p-1.5 rounded-lg hover:bg-purple-950/40 hover:text-cyan-300 border border-transparent hover:border-purple-500/30 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400"
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
                className="text-[11px] font-mono px-2 py-0.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-all"
              >
                EDIT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImageDisplayCardProps {
  url: string;
  thumbnail?: string;
  title: string;
  source?: string;
  author?: string;
  alt?: string;
}

function ImageDisplayCard({ url, thumbnail, title, source, author, alt }: ImageDisplayCardProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(url);

  const displayTitle = title || alt || "Image Result";
  const cleanFilename = displayTitle
    .slice(0, 28)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .concat(".jpg");

  const handleImageError = () => {
    // If main URL failed and a distinct thumbnail exists, try thumbnail
    if (thumbnail && imgSrc !== thumbnail) {
      setImgSrc(thumbnail);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="my-2.5 max-w-xl rounded-2xl overflow-hidden border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
        <div className="flex-1 min-w-0">
          <span className="font-medium">Image could not be rendered directly.</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold"
          >
            <span>View source image</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="my-2.5 max-w-xl rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-xl group transition-all duration-200 hover:border-[var(--accent-primary)]/40">
      {/* Visual Image Container */}
      <div className="relative overflow-hidden bg-black/40 flex items-center justify-center min-h-[180px] max-h-[512px]">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-surface)]/60 backdrop-blur-xs animate-pulse">
            <span className="text-xs text-[var(--text-muted)] font-medium">Loading image...</span>
          </div>
        )}
        <img
          src={imgSrc}
          alt={displayTitle}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={`w-full h-auto object-contain max-h-[512px] transition-all duration-300 group-hover:scale-[1.01] ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
      </div>

      {/* Metadata & Actions Bar */}
      <div className="p-3 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-sm gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {source && (
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                {source}
              </span>
            )}
            <span className="truncate font-semibold text-[var(--text-secondary)] text-[12px]">
              {displayTitle}
            </span>
          </div>
          {author && (
            <span className="text-[10.5px] text-[var(--text-muted)] truncate mt-0.5 pl-0.5">
              Photo by: <span className="font-medium text-[var(--text-secondary)]">{author}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={url}
            download={cleanFilename}
            target="_blank"
            rel="noopener noreferrer"
            title="Download image"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors font-medium text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>Download</span>
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open full size"
            className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
