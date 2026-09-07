"use client";

import React, { useEffect } from "react";
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
  onOpenSearch?: () => void;
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
  onOpenSearch,
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
    <div className="fixed inset-0 z-50 md:hidden flex overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - clean full-width inside drawer */}
      <div className="relative w-[280px] max-w-[85vw] h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col z-10 animate-in slide-in-from-left duration-250 overflow-hidden">
        <Sidebar
          isMobile={true}
          onClose={onClose}
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
          onOpenSearch={() => {
            if (onOpenSearch) {
              onOpenSearch();
              onClose();
            }
          }}
        />
      </div>
    </div>
  );
}
