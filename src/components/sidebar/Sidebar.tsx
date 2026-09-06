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
  User as UserIcon,
} from "lucide-react";
import { ConversationItem, UserProfile } from "@/types/chat";
import { Logo } from "@/components/layout/Logo";

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
        <div className="px-3 py-1 text-[10px] font-mono tracking-widest text-cyan-400/70 uppercase font-semibold flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-cyan-400/80 shadow-[0_0_4px_#00f0ff]" />
          <span>{title}</span>
        </div>
        <div className="space-y-1 mt-1">
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
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? "bg-purple-950/40 border-purple-500/50 text-cyan-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-medium"
                    : "border-transparent text-slate-300 hover:bg-purple-950/25 hover:border-purple-500/30 hover:text-white hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive
                        ? "text-cyan-400 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]"
                        : "text-slate-500 group-hover:text-purple-400"
                    }`}
                  />
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
                        className="w-full bg-[#0a0e1c] border border-cyan-400/60 rounded px-1.5 py-0.5 text-xs text-white outline-none shadow-[0_0_8px_rgba(0,240,255,0.3)]"
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
                    <span className="truncate">{conv.title}</span>
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
                      className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-purple-900/40 text-slate-400 hover:text-cyan-300 transition-all ${
                        isMenuOpen ? "!opacity-100 bg-purple-900/40 text-cyan-300" : ""
                      }`}
                      aria-label="Conversation options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#0e1224] border border-purple-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] p-1 z-50 animate-in fade-in zoom-in-95"
                      >
                        <button
                          type="button"
                          onClick={(e) => startRename(conv, e)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-cyan-300 hover:bg-purple-950/40 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Rename</span>
                        </button>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onDeleteConversation(conv.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    <aside className="w-64 h-full bg-[#050711]/90 backdrop-blur-xl border-r border-purple-500/20 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex flex-col justify-between select-none relative z-20">
      {/* Top Header & Brand */}
      <div className="p-3.5 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <Logo size="sm" showText={true} />
        </div>

        {/* Compact New Chat Button */}
        <button
          onClick={onNewChat}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-950/70 via-purple-900/60 to-indigo-950/70 hover:from-purple-900/90 hover:via-purple-800/80 hover:to-cyan-950/70 text-purple-100 hover:text-white border border-purple-500/40 hover:border-cyan-400/60 text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-cyan-400"
        >
          <Plus className="w-4 h-4 stroke-[2.5] text-cyan-400" />
          <span className="tracking-wide">NEW CHAT</span>
        </button>

        {/* Search Conversations */}
        <div className="relative mt-2.5">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#090d1c]/80 border border-purple-500/20 focus:border-cyan-400/60 focus:shadow-[0_0_12px_rgba(0,240,255,0.2)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            {searchQuery ? "NO CHATS MATCHED" : "NO ACTIVE SESSIONS"}
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
      <div className="p-3 border-t border-purple-500/20 bg-[#080b18]/80 backdrop-blur-md">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-7 h-7 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 ring-1 ring-cyan-400/30 shadow-[0_0_8px_rgba(0,240,255,0.25)] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : user.name ? (
                  user.name.slice(0, 2).toUpperCase()
                ) : (
                  "U"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="text-[10px] font-mono text-cyan-400/60 truncate">
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
                className="p-1.5 rounded-lg hover:bg-purple-950/40 text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 hover:border-cyan-400/50 text-xs font-semibold text-purple-100 hover:text-white flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(168,85,247,0.15)] transition-all"
          >
            <UserIcon className="w-4 h-4 text-cyan-400" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
}
