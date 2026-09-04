"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Square, X, FileText, Sparkles } from "lucide-react";
import { AttachmentItem, ChatStatus } from "@/types/chat";
import { AttachmentButton } from "./AttachmentButton";
import { VoiceInputButton } from "./VoiceInputButton";

interface ComposerProps {
  onSendMessage: (content: string, attachments?: AttachmentItem[]) => void;
  onStopGeneration: () => void;
  status: ChatStatus;
  enterToSend?: boolean;
  modelName?: string;
  initialValue?: string;
  onCancelEdit?: () => void;
}

export function Composer({
  onSendMessage,
  onStopGeneration,
  status,
  enterToSend = true,
  modelName = "GENZ Fast",
  initialValue = "",
  onCancelEdit,
}: ComposerProps) {
  const [content, setContent] = useState(initialValue);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initial value when editing
  useEffect(() => {
    if (!initialValue) return;
    const frame = requestAnimationFrame(() => {
      setContent(initialValue);
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialValue]);

  // Automatically grow textarea up to 200px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [content]);

  const isGenerating = status === "submitting" || status === "streaming";
  const canSend = content.trim().length > 0 || attachments.length > 0;

  const handleSubmit = () => {
    if (!canSend || isGenerating) return;
    onSendMessage(content.trim(), attachments);
    setContent("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddAttachment = (item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVoiceTranscription = (text: string) => {
    setContent((prev) => (prev ? `${prev.trim()} ${text}` : text));
    textareaRef.current?.focus();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const item = await res.json();
          handleAddAttachment(item);
        }
      } catch (err) {
        console.error("Drop upload failed:", err);
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5 pt-1">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-[var(--bg-surface)] border transition-all overflow-hidden shadow-lg ${
          isDragging
            ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 bg-[var(--accent-glow)]/20"
            : "border-[var(--border-subtle)] focus-within:border-[var(--border-focus)]"
        }`}
      >
        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)] animate-pulse">
              <Sparkles className="w-5 h-5" />
              <span>Drop files or images here to attach</span>
            </div>
          </div>
        )}

        {/* Editing banner */}
        {initialValue && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--accent-glow)]/60 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--accent-primary)]">Editing previous message</span>
            <button
              type="button"
              onClick={() => {
                setContent("");
                onCancelEdit?.();
              }}
              className="p-1 hover:text-[var(--text-primary)] rounded transition-colors"
              title="Cancel edit"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview pills */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] shadow-sm animate-in fade-in"
              >
                {att.mimeType.startsWith("image/") ? (
                  <div className="w-4 h-4 rounded overflow-hidden bg-black/40 flex items-center justify-center shrink-0">
                    <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="truncate max-w-[140px] font-medium">
                  {att.filename}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  ({Math.round(att.size / 1024)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(i)}
                  className="ml-1 p-0.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message GENZ-AI..."
          rows={1}
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none text-[15px] leading-relaxed max-h-[200px] overflow-y-auto"
        />

        {/* Bottom Toolbar: [ Attach ] [ Mic ] [ Model label ] ... [ Send ] */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <AttachmentButton
              onAttachmentUploaded={handleAddAttachment}
              disabled={isGenerating}
            />
            <VoiceInputButton
              onTranscription={handleVoiceTranscription}
              disabled={isGenerating}
            />
            <span className="text-[11px] font-medium text-[var(--text-muted)] px-2 select-none hidden sm:inline-block">
              {modelName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                title="Stop generation"
                aria-label="Stop generation"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-medium text-xs border border-rose-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                title="Send message"
                aria-label="Send message"
                className="w-8 h-8 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-[11px] text-[var(--text-muted)] select-none">
          GENZ-AI may produce inaccurate info. Verify important code & facts.
        </p>
      </div>
    </div>
  );
}
