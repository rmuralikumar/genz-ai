"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  PanelLeftClose,
} from "lucide-react";
import { ConversationItem, UserProfile } from "@/types/chat";
import { Logo } from "@/components/layout/Logo";
import { useToast } from "@/components/ui/Toast";

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
  onOpenSearch?: () => void;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
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
  onOpenSearch,
  onToggleCollapse,
  isMobile = false,
  onClose,
}: SidebarProps) {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showInlineSearch, setShowInlineSearch] = useState(false);

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
      isAvailable: true,
      onClick: () => {
        onNewChat();
        if (isMobile && onClose) onClose();
      },
    },
    {
      id: "images",
      label: "Images",
      icon: ImageIcon,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "library",
      label: "Library",
      icon: Library,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "scheduled",
      label: "Scheduled",
      icon: Clock,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: Puzzle,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderKanban,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "codex",
      label: "Codex",
      icon: Code2,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
    {
      id: "more",
      label: "More",
      icon: MoreHorizontal,
      isAvailable: false,
      onClick: () => {
        showToast("Coming soon");
      },
    },
  ];

  const handleSearchClick = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      setShowInlineSearch((prev) => !prev);
    }
  };

  const renderConversationItem = (conv: ConversationItem, isPinned = false) => {
    const isActive = conv.id === activeId;
    const isEditing = conv.id === editingId;
    const isMenuOpen = conv.id === menuOpenId;

    return (
      <div
        key={conv.id}
        onClick={() => {
          if (!isEditing) {
            onSelectConversation(conv.id);
            if (isMobile && onClose) onClose();
          }
        }}
        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] cursor-pointer transition-colors ${
          isActive
            ? "bg-[var(--accent-glow)] text-[var(--text-primary)] font-medium border border-[var(--accent-primary)]/30 shadow-xs"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive
                ? "text-[var(--accent-cyan)]"
                : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
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
                className="w-full bg-[var(--bg-card)] border border-[var(--accent-cyan)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                type="submit"
                className="p-0.5 text-emerald-500 hover:text-emerald-400"
                aria-label="Save name"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="p-0.5 text-rose-500 hover:text-rose-400"
                aria-label="Cancel rename"
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
              <Pin className="w-3 h-3 text-[var(--accent-cyan)] fill-[var(--accent-cyan)]/20 shrink-0" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(isMenuOpen ? null : conv.id);
              }}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-opacity ${
                isMenuOpen ? "!opacity-100 bg-[var(--bg-surface-hover)] text-[var(--text-primary)]" : ""
              }`}
              aria-label="Conversation options"
            >
              <MoreHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl p-1 z-50 text-xs animate-in fade-in zoom-in-95"
              >
                <button
                  type="button"
                  onClick={(e) => togglePin(conv.id, e)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Pin className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{isPinned ? "Unpin chat" : "Pin chat"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => startRename(conv, e)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
    <aside
      className={`h-full bg-[var(--bg-sidebar)] backdrop-blur-xl border-r border-[var(--border-subtle)] flex flex-col justify-between select-none relative z-20 transition-all ${
        isMobile ? "w-full" : "w-64"
      }`}
    >
      {/* Top Header */}
      <div className="pt-3 px-3 pb-2 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <Link
          href="/"
          title="GENZ-AI Home"
          onClick={() => {
            if (isMobile && onClose) onClose();
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <Logo size="sm" showText={true} />
        </Link>

        <div className="flex items-center gap-1">
          {/* Search Toggle Icon */}
          <button
            type="button"
            onClick={handleSearchClick}
            title="Search conversations (Ctrl+K)"
            aria-label="Search conversations"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Search className="w-4 h-4 stroke-[1.75]" />
          </button>

          {/* Desktop Collapse Button */}
          {!isMobile && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Close sidebar"
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <PanelLeftClose className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close sidebar"
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Inline Search Input (shown when toggled or when searchQuery exists) */}
        {(showInlineSearch || searchQuery) && (
          <div className="relative px-1 pt-1 animate-in fade-in">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              autoFocus
              placeholder="Filter chats..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-focus)] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Clear filter"
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
            if (!item.isAvailable) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  aria-disabled="true"
                  title={`${item.label} (Coming soon)`}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-[var(--text-muted)] stroke-[1.75] group-hover:text-[var(--text-secondary)] shrink-0 opacity-70" />
                    <span className="truncate opacity-80">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--text-muted)] shrink-0 select-none">
                    Soon
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors group"
              >
                <Icon className="w-4 h-4 text-[var(--accent-cyan)] stroke-[1.75] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* PINNED Section */}
        {pinnedList.length > 0 && (
          <div className="pt-2">
            <div className="px-2.5 pb-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Pinned
            </div>
            <div className="space-y-0.5">
              {pinnedList.map((conv) => renderConversationItem(conv, true))}
            </div>
          </div>
        )}

        {/* RECENTS Section */}
        <div className="pt-1">
          <div className="px-2.5 pb-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Recents
          </div>
          {recentList.length === 0 && pinnedList.length === 0 ? (
            <div className="px-2.5 py-3 text-xs text-[var(--text-muted)]">
              {searchQuery ? "No matching chats found" : "No chats yet"}
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentList.map((conv) => renderConversationItem(conv, false))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/70 backdrop-blur-md shrink-0">
        {user ? (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
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
                <div className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-tight">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
                  {user.email || "Free"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  if (isMobile && onClose) onClose();
                }}
                title="Settings"
                aria-label="Settings"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <Settings className="w-4 h-4 stroke-[1.75]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  if (isMobile && onClose) onClose();
                }}
                title="Sign out"
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onOpenAuth();
              if (isMobile && onClose) onClose();
            }}
            className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <UserIcon className="w-4 h-4 stroke-[1.75] text-[var(--accent-primary)]" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
}
