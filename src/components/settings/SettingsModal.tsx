"use client";

import React, { useState, useEffect } from "react";
import { X, Moon, Sun, Monitor, Sparkles, MessageSquare, BarChart3, User } from "lucide-react";
import { UserProfile, UserSettings } from "@/types/chat";
import { AVAILABLE_MODELS } from "@/lib/ai/models";

type TabType = "general" | "chat" | "account" | "usage";
type ThemeType = "dark" | "light" | "system";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  settings: UserSettings;
  onSaveSettings: (newSettings: Partial<UserSettings>, name?: string) => Promise<void>;
  usageStats?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestsCount: number;
  };
}

export function SettingsModal({
  isOpen,
  onClose,
  user,
  settings,
  onSaveSettings,
  usageStats,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(settings.theme || "dark");
  const [defaultModel, setDefaultModel] = useState(settings.defaultModel || "genz-fast");
  const [enterToSend, setEnterToSend] = useState(settings.enterToSend ?? true);
  const [autoScroll, setAutoScroll] = useState(settings.autoScroll ?? true);
  const [compactMode, setCompactMode] = useState(settings.compactMode ?? false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      setCurrentTheme(settings.theme || "dark");
      setDefaultModel(settings.defaultModel || "genz-fast");
      setEnterToSend(settings.enterToSend ?? true);
      setAutoScroll(settings.autoScroll ?? true);
      setCompactMode(settings.compactMode ?? false);
      if (user?.name) setDisplayName(user.name);
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, settings, user]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSettings(
        {
          theme: currentTheme,
          defaultModel,
          enterToSend,
          autoScroll,
          compactMode,
        },
        displayName
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] select-none">
          <h3 className="font-semibold text-base text-[var(--text-primary)]">Settings</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 select-none overflow-x-auto">
          {[
            { id: "general", label: "General", icon: Sparkles },
            { id: "chat", label: "Chat", icon: MessageSquare },
            { id: "account", label: "Account", icon: User },
            { id: "usage", label: "Usage", icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? "border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* GENERAL TAB */}
          {activeTab === "general" && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "light", label: "Light", icon: Sun },
                    { id: "system", label: "System", icon: Monitor },
                  ].map((themeOpt) => {
                    const Icon = themeOpt.icon;
                    const isSelected = currentTheme === themeOpt.id;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => setCurrentTheme(themeOpt.id as ThemeType)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? "bg-[var(--accent-glow)] border-[var(--accent-primary)] text-[var(--accent-primary)]"
                            : "bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1.5" />
                        <span className="text-xs font-medium">{themeOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Default AI Model
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.badge})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Press Enter to Send</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Send messages on Enter, use Shift+Enter for newline
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enterToSend}
                  onChange={(e) => setEnterToSend(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Auto-scroll Feed</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Automatically track and scroll down during streaming
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">Compact View Mode</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Reduces vertical padding for dense message viewing
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div className="space-y-4">
              {user ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-[var(--bg-card)]/50 border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-[var(--text-muted)]">
                  You are currently using GENZ-AI in Guest mode. Sign in to sync your profile.
                </div>
              )}
            </div>
          )}

          {/* USAGE TAB */}
          {activeTab === "usage" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Total Tokens</div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">
                    {usageStats?.totalTokens?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Messages Processed</div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">
                    {usageStats?.requestsCount?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Prompt Tokens</div>
                  <div className="text-sm font-semibold text-[var(--text-secondary)]">
                    {usageStats?.promptTokens?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Completion Tokens</div>
                  <div className="text-sm font-semibold text-[var(--text-secondary)]">
                    {usageStats?.completionTokens?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/60 flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-medium">
            {savedSuccess && "Preferences saved successfully!"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
