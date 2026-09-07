"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Zap,
  Plus,
  Settings,
  Check,
  Search,
  PanelLeft,
} from "lucide-react";
import { AVAILABLE_MODELS, ModelConfig } from "@/lib/ai/models";
import { UserProfile } from "@/types/chat";

interface ChatHeaderProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  user?: UserProfile | null;
  onOpenSearch?: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export function ChatHeader({
  currentModel,
  onSelectModel,
  onOpenMobileSidebar,
  onNewChat,
  onOpenSettings,
  user,
  onOpenSearch,
  isDesktopSidebarCollapsed = false,
  onToggleDesktopSidebar,
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
    <header className="h-12 sm:h-13 px-3 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-xl flex items-center justify-between z-30 shrink-0 select-none transition-colors">
      <div className="flex items-center gap-2">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop Sidebar Expand Toggle (shown when collapsed) */}
        {isDesktopSidebarCollapsed && onToggleDesktopSidebar && (
          <button
            type="button"
            onClick={onToggleDesktopSidebar}
            title="Open sidebar"
            aria-label="Open sidebar"
            className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Model Selector Dropdown with Lightning Badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border transition-all text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] ${
              dropdownOpen
                ? "border-[var(--accent-cyan)] shadow-[0_0_12px_var(--cyan-glow)] text-[var(--accent-cyan)]"
                : "border-[var(--border-subtle)] hover:border-[var(--accent-primary)]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{activeModel.name}</span>
              {/* Lightning Badge */}
              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--accent-glow)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">
                <Zap className="w-2.5 h-2.5 fill-current" />
                <span>{activeModel.badge}</span>
              </span>
            </span>
            <ChevronDown
              className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-[var(--accent-cyan)] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_4px_var(--accent-cyan)]" />
                <span>NEURAL ENGINE</span>
              </div>
              <div className="space-y-1 mt-1">
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
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 border ${
                        isSelected
                          ? "bg-[var(--accent-glow)] border-[var(--accent-primary)]/50 text-[var(--text-primary)] shadow-xs"
                          : "border-transparent hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="mt-0.5">
                        <Zap
                          className={`w-3.5 h-3.5 ${
                            isSelected
                              ? "text-[var(--accent-cyan)] fill-[var(--accent-cyan)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{model.name}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5 font-mono">
                          {model.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Quick Search */}
        <button
          type="button"
          onClick={onOpenSearch || onOpenMobileSidebar}
          title="Search conversations (Ctrl+K)"
          aria-label="Search conversations"
          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Compact New Chat */}
        <button
          type="button"
          onClick={onNewChat}
          title="New Chat"
          aria-label="New chat"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)] shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span className="hidden sm:inline font-mono text-[11px]">NEW CHAT</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        {user && (
          <div
            onClick={onOpenSettings}
            role="button"
            tabIndex={0}
            title={user.name || user.email}
            aria-label="User settings"
            className="ml-1 cursor-pointer w-6 h-6 rounded-full ring-1 ring-[var(--accent-cyan)]/50 hover:ring-[var(--accent-cyan)] shadow-xs overflow-hidden bg-[var(--accent-glow)] flex items-center justify-center text-[10px] font-bold text-[var(--accent-cyan)] transition-all"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              (user.name ? user.name.slice(0, 1) : "U").toUpperCase()
            )}
          </div>
        )}
      </div>
    </header>
  );
}
