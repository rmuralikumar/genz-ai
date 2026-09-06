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
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5 pt-1 select-none">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl bg-[#090d1e]/85 backdrop-blur-2xl border transition-all duration-300 overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.7)] ${
          isDragging
            ? "border-cyan-400 ring-2 ring-cyan-400/50 bg-purple-950/30 shadow-[0_0_30px_rgba(0,240,255,0.35)]"
            : "border-purple-500/35 hover:border-cyan-500/50 focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(0,240,255,0.25),inset_0_0_15px_rgba(168,85,247,0.08)]"
        }`}
      >
        {/* Holographic Top Edge Highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

        {/* Drag and drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300 animate-pulse">
              <Sparkles className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_#00f0ff]" />
              <span>DROP FILES OR IMAGES TO INGEST</span>
            </div>
          </div>
        )}

        {/* Editing banner */}
        {initialValue && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-purple-950/60 border-b border-purple-500/30 text-xs text-slate-300">
            <span className="font-mono text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              EDITING MESSAGE DIRECTIVE
            </span>
            <button
              type="button"
              onClick={() => {
                setContent("");
                onCancelEdit?.();
              }}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0c1024] border border-purple-500/35 text-xs text-slate-200 shadow-sm animate-in fade-in"
              >
                {att.mimeType.startsWith("image/") ? (
                  <div className="w-4 h-4 rounded overflow-hidden bg-black/50 flex items-center justify-center shrink-0 ring-1 ring-cyan-400/30">
                    <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="truncate max-w-[140px] font-mono text-[11px]">
                  {att.filename}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({Math.round(att.size / 1024)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(i)}
                  className="ml-1 p-0.5 rounded hover:bg-purple-950 text-slate-400 hover:text-pink-400 transition-colors"
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
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] overflow-y-auto selection:bg-cyan-500/25 selection:text-cyan-200"
        />

        {/* Bottom Floating Control Bar */}
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
            {/* Model Indicator Pill */}
            <span className="text-[10px] font-mono tracking-wider text-cyan-400/80 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/20 select-none hidden sm:inline-block">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900/70 text-pink-300 font-mono text-xs border border-pink-500/40 shadow-[0_0_12px_rgba(255,42,133,0.3)] transition-all focus:outline-none focus:ring-1 focus:ring-pink-400"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>HALT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                title="Send message"
                aria-label="Send message"
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] focus:outline-none focus:ring-1 focus:ring-cyan-400 active:scale-95"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-[10px] font-mono text-slate-500 select-none tracking-wider">
          GENZ-AI // SYSTEM v2.0 • SYNTHWAVE QUANTUM CORE
        </p>
      </div>
    </div>
  );
}
