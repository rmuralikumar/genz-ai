"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

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
    <div className="my-3.5 rounded-xl overflow-hidden border border-purple-500/30 bg-[#04050b] shadow-[0_0_20px_rgba(0,0,0,0.6)] text-sm">
      {/* Retro Terminal Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#090d1c] border-b border-purple-500/20 text-xs font-mono select-none">
        <div className="flex items-center gap-2.5">
          {/* CRT Terminal Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500/80 shadow-[0_0_5px_#ff2a85]" />
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80 shadow-[0_0_5px_#a855f7]" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_5px_#00f0ff]" />
          </div>
          <div className="flex items-center gap-1.5 ml-1 text-slate-400">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-semibold tracking-wider text-cyan-300 uppercase">
              {language || "sh"}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          aria-label={copied ? "Code copied" : "Copy code"}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-purple-950/40 text-slate-400 hover:text-cyan-300 border border-transparent hover:border-purple-500/30 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_6px_#00f0ff]" />
              <span className="text-cyan-300 font-medium">COPIED</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Code Canvas */}
      <pre className="p-4 overflow-x-auto text-[#f1f5f9] font-mono text-[13px] leading-relaxed selection:bg-cyan-500/25 selection:text-cyan-200">
        <code>{value}</code>
      </pre>
    </div>
  );
}

