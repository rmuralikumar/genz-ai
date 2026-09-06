"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ConversationItem, UserProfile } from "@/types/chat";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileSidebar({
  isOpen,
  onClose,
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
}: MobileSidebarProps) {
  // Handle ESC key to close drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-72 max-w-[85vw] h-full bg-[#050711]/95 backdrop-blur-2xl border-r border-purple-500/30 shadow-[0_0_30px_rgba(0,0,0,0.9)] flex flex-col z-10 animate-in slide-in-from-left duration-300">
        {/* Close Button Header */}
        <div className="absolute right-2.5 top-3 z-20">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg bg-purple-950/50 border border-purple-500/30 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Component */}
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={(id) => {
            onSelectConversation(id);
            onClose();
          }}
          onNewChat={() => {
            onNewChat();
            onClose();
          }}
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          user={user}
          onOpenSettings={() => {
            onOpenSettings();
            onClose();
          }}
          onLogout={() => {
            onLogout();
            onClose();
          }}
          onOpenAuth={() => {
            onOpenAuth();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
