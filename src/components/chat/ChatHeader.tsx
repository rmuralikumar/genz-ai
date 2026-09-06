"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, ChevronDown, Zap, Plus, Settings, Check, Search, Moon, Sun } from "lucide-react";
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
}

export function ChatHeader({
  currentModel,
  onSelectModel,
  onOpenMobileSidebar,
  onNewChat,
  onOpenSettings,
  user,
  onOpenSearch,
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
    <header className="h-12 sm:h-13 px-3 sm:px-4 border-b border-cyan-500/15 bg-[#060812]/85 backdrop-blur-xl flex items-center justify-between z-30 shrink-0 select-none shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Model Selector Dropdown with Lightning Badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border transition-all text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
              dropdownOpen
                ? "border-cyan-400/60 shadow-[0_0_12px_rgba(0,240,255,0.25)] text-cyan-200"
                : "border-purple-500/30 hover:border-cyan-500/40"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-slate-100">{activeModel.name}</span>
              {/* Lightning Badge */}
              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_6px_rgba(0,240,255,0.3)]">
                <Zap className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400" />
                <span>{activeModel.badge}</span>
              </span>
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#0c0f20] border border-purple-500/40 shadow-[0_0_25px_rgba(0,0,0,0.85)] p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-cyan-400/80 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_#00f0ff]" />
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
                          ? "bg-purple-950/50 border-purple-500/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                          : "border-transparent hover:bg-purple-950/30 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="mt-0.5">
                        <Zap className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400 fill-cyan-400 drop-shadow-[0_0_6px_#00f0ff]" : "text-slate-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{model.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5 font-mono">
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
          title="Search"
          aria-label="Search conversations"
          className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Compact New Chat */}
        <button
          type="button"
          onClick={onNewChat}
          title="New Chat"
          aria-label="New chat"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/30 hover:border-cyan-400/40 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline font-mono text-[11px]">NEW CHAT</span>
        </button>

        {/* Theme/Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Open settings"
          className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* User Avatar */}
        {user && (
          <div
            onClick={onOpenSettings}
            role="button"
            tabIndex={0}
            title={user.name || user.email}
            aria-label="User settings"
            className="ml-1 cursor-pointer w-6 h-6 rounded-full ring-1 ring-cyan-400/50 hover:ring-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.25)] overflow-hidden bg-purple-950/80 flex items-center justify-center text-[10px] font-bold text-cyan-300 transition-all"
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

