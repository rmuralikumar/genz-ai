"use client";

import React, { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { AttachmentItem } from "@/types/chat";

interface AttachmentButtonProps {
  onAttachmentUploaded: (attachment: AttachmentItem) => void;
  disabled?: boolean;
}

export function AttachmentButton({
  onAttachmentUploaded,
  disabled,
}: AttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so same file can be selected again if needed
    e.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload file");
      }

      const data = await res.json();
      onAttachmentUploaded(data);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.md,.json,.js,.ts"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        title="Add attachment (images, PDF, code)"
        aria-label="Add attachment"
        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-purple-950/40 transition-colors disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-cyan-400"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>
    </>
  );
}
