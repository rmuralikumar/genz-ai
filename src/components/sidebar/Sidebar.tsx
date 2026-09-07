"use client";

import React, { useState, useEffect } from "react";
import {
  SquarePen,
  Image as ImageIcon,
  Library,
  Clock,
  Puzzle,
  FolderKanban,
  Code2,
  MoreHorizontal,
  Search,
  Pin,
  MessageSquare,
  Edit2,
  Trash2,
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
  const [showSearch, setShowSearch] = useState(false);
  const [activeNav, setActiveNav] = useState<string>("new-chat");

  // Pinned conversations stored in localStorage
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("genz_pinned_chats");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem("genz_pinned_chats", JSON.stringify(next));
      } catch {}
      return next;
    });
    setMenuOpenId(null);
  };

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

  // Separate pinned vs recent conversations
  const pinnedList = conversations.filter((c) => pinnedIds.includes(c.id));
  const recentList = conversations.filter((c) => !pinnedIds.includes(c.id));

  // Navigation Items
  const navItems = [
    {
      id: "new-chat",
      label: "New chat",
      icon: SquarePen,
      onClick: () => {
        setActiveNav("new-chat");
        onNewChat();
      },
    },
    {
      id: "images",
      label: "Images",
      icon: ImageIcon,
      onClick: () => setActiveNav("images"),
    },
    {
      id: "library",
      label: "Library",
      icon: Library,
      onClick: () => setActiveNav("library"),
    },
    {
      id: "scheduled",
      label: "Scheduled",
      icon: Clock,
      onClick: () => setActiveNav("scheduled"),
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: Puzzle,
      onClick: () => setActiveNav("plugins"),
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      onClick: () => setActiveNav("projects"),
    },
    {
      id: "codex",
      label: "Codex",
      icon: Code2,
      onClick: () => setActiveNav("codex"),
    },
    {
      id: "more",
      label: "More",
      icon: MoreHorizontal,
      onClick: () => setActiveNav("more"),
    },
  ];

  const renderConversationItem = (conv: ConversationItem, isPinned = false) => {
    const isActive = conv.id === activeId;
    const isEditing = conv.id === editingId;
    const isMenuOpen = conv.id === menuOpenId;

    return (
      <div
        key={conv.id}
        onClick={() => {
          if (!isEditing) onSelectConversation(conv.id);
        }}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
          isActive
            ? "bg-white/10 text-white font-medium shadow-xs"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className="w-4 h-4 shrink-0 text-slate-400 stroke-[1.5] group-hover:text-slate-200" />
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
                className="w-full bg-[#0a0e1c] border border-cyan-400/50 rounded px-1.5 py-0.5 text-xs text-white outline-none"
              />
              <button
                type="submit"
                className="p-0.5 text-emerald-400 hover:text-emerald-300"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="p-0.5 text-rose-400 hover:text-rose-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <span className="truncate">{conv.title}</span>
          )}
        </div>

        {/* Action button on hover */}
        {!isEditing && (
          <div className="relative flex items-center gap-1">
            {isPinned && (
              <Pin className="w-3 h-3 text-cyan-400/70 fill-cyan-400/20 shrink-0" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : conv.id);
              }}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-400 hover:text-white transition-opacity ${
                isMenuOpen ? "!opacity-100 bg-white/10 text-white" : ""
              }`}
              aria-label="Options"
            >
              <MoreHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#0f1325] border border-purple-500/20 shadow-2xl p-1 z-50 text-xs animate-in fade-in zoom-in-95"
              >
                <button
                  type="button"
                  onClick={(e) => togglePin(conv.id, e)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Pin className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{isPinned ? "Unpin chat" : "Pin chat"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => startRename(conv, e)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onDeleteConversation(conv.id);
                    setMenuOpenId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-[#050711]/90 backdrop-blur-xl border-r border-purple-500/20 shadow-[4px_0_24px_rgba(0,0,0,0.5)] flex flex-col justify-between select-none relative z-20">
      {/* Top Branding */}
      <div className="pt-3.5 px-3 pb-2 flex items-center justify-between border-b border-purple-500/15">
        <Logo size="sm" showText={true} />
        {/* Compact Search Toggle Icon */}
        <button
          type="button"
          onClick={() => setShowSearch((prev) => !prev)}
          title="Search conversations"
          aria-label="Search conversations"
          className={`p-1.5 rounded-lg transition-colors ${
            showSearch || searchQuery
              ? "bg-white/10 text-cyan-300"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Search className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Compact Search Input (shown when toggled or when searchQuery exists) */}
        {(showSearch || searchQuery) && (
          <div className="relative px-1 pt-1 animate-in fade-in">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#0a0e1c] border border-purple-500/30 focus:border-cyan-400/60 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* ChatGPT-style Navigation List */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors group ${
                  isSelected
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 text-slate-400 stroke-[1.75] group-hover:text-slate-200 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* PINNED Section */}
        {pinnedList.length > 0 && (
          <div className="pt-2">
            <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedList.map((conv) => renderConversationItem(conv, true))}
            </div>
          </div>
        )}

        {/* RECENTS Section */}
        <div className="pt-1">
          <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Recents
          </div>
          {recentList.length === 0 && pinnedList.length === 0 ? (
            <div className="px-2.5 py-3 text-xs text-slate-500">
              {searchQuery ? "No matching chats found" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentList.map((conv) => renderConversationItem(conv, false))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Section (Fixed) */}
      <div className="p-2.5 border-t border-purple-500/20 bg-[#080b18]/80 backdrop-blur-md shrink-0">
        {user ? (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-8 h-8 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 ring-1 ring-cyan-400/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
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
                <div className="text-[13px] font-medium text-slate-200 truncate leading-tight">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="text-[11px] text-slate-400 truncate leading-tight">
                  {user.email || "Free"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings"
                aria-label="Settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 stroke-[1.75]" />
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-purple-500/20 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <UserIcon className="w-4 h-4 stroke-[1.75]" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
}

