"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, Sparkles, Plus, Settings, Check } from "lucide-react";
import { AVAILABLE_MODELS, ModelConfig } from "@/lib/ai/models";

interface ChatHeaderProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function ChatHeader({
  currentModel,
  onSelectModel,
  onOpenMobileSidebar,
  onNewChat,
  onOpenSettings,
}: ChatHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.id === currentModel) || AVAILABLE_MODELS[0];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 px-3 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0 select-none">
      <div className="flex items-center gap-2">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
          >
            <span className="flex items-center gap-1.5">
              <span>{activeModel.name}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--accent-glow)] text-[var(--accent-primary)]">
                {activeModel.badge}
              </span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Select Model
              </div>
              {AVAILABLE_MODELS.map((model: ModelConfig) => {
                const isSelected = model.id === currentModel;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)]"
                        : "hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="mt-0.5">
                      <Sparkles className={`w-4 h-4 ${isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{model.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                        {model.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onNewChat}
          title="New Chat"
          aria-label="New chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
