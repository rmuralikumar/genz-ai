"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language = "code", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--code-bg)] shadow-md text-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--bg-surface)]/80 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono select-none">
        <span className="uppercase font-semibold tracking-wider">{language || "text"}</span>
        <button
          onClick={handleCopy}
          type="button"
          aria-label={copied ? "Code copied" : "Copy code"}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[var(--text-primary)] font-mono text-[13px] leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  );
}
