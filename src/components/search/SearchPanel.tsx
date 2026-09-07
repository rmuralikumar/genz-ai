"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, MessageSquare, Plus, CornerDownLeft } from "lucide-react";
import { ConversationItem } from "@/types/chat";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function SearchPanel({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  onNewChat,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter conversations
  const filtered = useMemo(() => {
    if (!query.trim()) return conversations.slice(0, 20);
    const q = query.toLowerCase().trim();
    return conversations.filter((c) => c.title.toLowerCase().includes(q)).slice(0, 30);
  }, [conversations, query]);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => {
        setQuery("");
        setSelectedIndex(0);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectConversation(filtered[selectedIndex].id);
          onClose();
        } else if (query.trim()) {
          // If no matches, Enter creates new chat
          onNewChat();
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, onSelectConversation, onNewChat, query]);

  // Ensure highlighted item is scrolled into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette Card */}
      <div
        role="dialog"
        aria-label="Search conversations"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[0_16px_50px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-xs font-mono"
            aria-label="Close search"
          >
            <span className="hidden sm:inline">ESC</span>
            <X className="w-4 h-4 sm:hidden" />
          </button>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto p-2 space-y-1 select-none"
        >
          {filtered.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                No conversations found for &ldquo;{query}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-glow)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start a new chat instead</span>
              </button>
            </div>
          ) : (
            filtered.map((conv, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] shadow-xs"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isSelected
                          ? "text-[var(--accent-cyan)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    />
                    <span className="truncate font-medium">{conv.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-[var(--accent-cyan)] animate-in fade-in" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--bg-surface-hover)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-[10px]">
                ↓
              </kbd>
              <span className="hidden sm:inline">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-[10px]">
                ↵
              </kbd>
              <span className="hidden sm:inline">to select</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
          >
            <Plus className="w-3 h-3" />
            <span>New chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
