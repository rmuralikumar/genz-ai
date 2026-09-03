"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  LogOut,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { ConversationItem, UserProfile } from "@/types/chat";

interface SidebarProps {
  conversations: ConversationItem[];
  activeId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: UserProfile | null;
  onOpenSettings: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  searchQuery,
  onSearchChange,
  user,
  onOpenSettings,
  onLogout,
  onOpenAuth,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const startRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const submitRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      await onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Group conversations by date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;

  const todayList: ConversationItem[] = [];
  const weekList: ConversationItem[] = [];
  const olderList: ConversationItem[] = [];

  for (const conv of conversations) {
    const time = new Date(conv.updatedAt).getTime();
    if (time >= today) {
      todayList.push(conv);
    } else if (time >= sevenDaysAgo) {
      weekList.push(conv);
    } else {
      olderList.push(conv);
    }
  }

  const renderSection = (title: string, items: ConversationItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-0.5">
          {items.map((conv) => {
            const isActive = conv.id === activeId;
            const isEditing = conv.id === editingId;
            const isMenuOpen = conv.id === menuOpenId;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (!isEditing) onSelectConversation(conv.id);
                }}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                  isActive
                    ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]/60 hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare className="w-4 h-4 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  {isEditing ? (
                    <form
                      onSubmit={(e) => submitRename(conv.id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 flex-1"
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-focus)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="truncate text-xs">{conv.title}</span>
                  )}
                </div>

                {/* Context action menu */}
                {!isEditing && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : conv.id);
                      }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity ${
                        isMenuOpen ? "!opacity-100" : ""
                      }`}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-28 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl p-1 z-50 animate-in fade-in"
                      >
                        <button
                          type="button"
                          onClick={(e) => startRename(conv, e)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between select-none">
      {/* Top Header & Brand */}
      <div className="p-3.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
              GENZ-AI
            </span>
          </div>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        {/* Search Conversations */}
        <div className="relative mt-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-focus)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)]">
            {searchQuery ? "No matching chats found." : "No chats yet. Start talking!"}
          </div>
        ) : (
          <>
            {renderSection("Today", todayList)}
            {renderSection("Previous 7 Days", weekList)}
            {renderSection("Older", olderList)}
          </>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center text-xs font-bold shrink-0">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings"
                aria-label="Settings"
                className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg hover:bg-rose-500/15 text-[var(--text-secondary)] hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
          >
            <UserIcon className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
}
