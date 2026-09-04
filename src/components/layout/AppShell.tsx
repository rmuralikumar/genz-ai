"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileSidebar } from "@/components/sidebar/MobileSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/composer/Composer";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  ChatMessage,
  ConversationItem,
  UserProfile,
  UserSettings,
  ChatStatus,
  AttachmentItem,
  ChatErrorInfo,
  ImageItem,
  SearchSource,
  ResearchStep,
} from "@/types/chat";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";

export function AppShell() {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "dark",
    defaultModel: DEFAULT_MODEL_ID,
    enterToSend: true,
    autoScroll: true,
    compactMode: false,
  });
  const [usageStats, setUsageStats] = useState<{
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    requestsCount: number;
  }>({ totalTokens: 0, promptTokens: 0, completionTokens: 0, requestsCount: 0 });

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentModel, setCurrentModel] = useState<string>(DEFAULT_MODEL_ID);

  const [status, setStatus] = useState<ChatStatus>("idle");
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [errorInfo, setErrorInfo] = useState<ChatErrorInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageContent, setEditingMessageContent] = useState<string>("");

  // Modals & Drawers
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFailedPromptRef = useRef<{ content: string; attachments?: AttachmentItem[] } | null>(null);

  // Apply Theme
  useEffect(() => {
    const theme = settings.theme || "dark";
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [settings.theme]);

  const loadConversations = async (search?: string) => {
    try {
      const url = search
        ? `/api/conversations?search=${encodeURIComponent(search)}`
        : "/api/conversations";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadUserSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.usage) setUsageStats(data.usage);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  // Load User, Settings, and Conversations on Mount
  useEffect(() => {
    async function init() {
      // Check for OAuth URL query params
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const authSuccess = params.get("auth_success");
        const authError = params.get("auth_error");

        if (authSuccess) {
          try {
            localStorage.removeItem("genz_logged_out");
          } catch {}
          setAuthModalOpen(false);
          setAuthErrorMessage(null);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (authError) {
          setAuthErrorMessage(decodeURIComponent(authError));
          setAuthModalOpen(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        
        let currentUser = meData.user;
        const isExplicitlyLoggedOut =
          typeof window !== "undefined" &&
          localStorage.getItem("genz_logged_out") === "true";

        if (!currentUser && !isExplicitlyLoggedOut) {
          // Auto-provision guest account for seamless instant interaction
          const guestEmail = `guest_${Math.random().toString(36).substring(2, 9)}@genz.ai`;
          const regRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: guestEmail,
              password: "GuestUserSecurePass123!",
              name: "GENZ Explorer",
            }),
          });
          if (regRes.ok) {
            const regData = await regRes.json();
            currentUser = regData.user;
          }
        }

        if (currentUser) {
          setUser(currentUser);
          if (currentUser.settings) {
            setSettings(currentUser.settings);
            setCurrentModel(currentUser.settings.defaultModel || DEFAULT_MODEL_ID);
          }
          await loadConversations();
          await loadUserSettings();
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    }
    init();
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    loadConversations(query);
  };

  // Select conversation and load messages
  const handleSelectConversation = async (id: string) => {
    if (status === "streaming") {
      handleStopGeneration();
    }
    setActiveId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation.messages || []);
        if (data.conversation.model) {
          setCurrentModel(data.conversation.model);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    if (status === "streaming") {
      handleStopGeneration();
    }
    setActiveId(undefined);
    setMessages([]);
    setStreamingContent("");
    setStatus("idle");
  };

  // Rename a conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (streamingContent.trim()) {
      const stoppedMsg: ChatMessage = {
        id: `stopped-${Date.now()}`,
        conversationId: activeId || "temp",
        role: "assistant",
        content: streamingContent + " *(Stopped)*",
        model: currentModel,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, stoppedMsg]);
    }
    setStreamingContent("");
    setStatus("stopped");
  };

  // Send Message & Stream Response
  const handleSendMessage = async (
    content: string,
    attachments?: AttachmentItem[],
    isRetry = false
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    // Check if user is authenticated before sending
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    let convId = activeId;

    // If no active conversation, create one first
    if (!convId) {
      try {
        const createRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: content.slice(0, 36) || "New Chat",
            model: currentModel,
          }),
        });
        if (createRes.status === 401) {
          setUser(null);
          setAuthModalOpen(true);
          return;
        }
        if (!createRes.ok) throw new Error("Could not start conversation");
        const createData = await createRes.json();
        convId = createData.conversation.id;
        setActiveId(convId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setErrorInfo({
          code: "CONVERSATION_CREATE_ERROR",
          message: "Could not start conversation. Please sign in or try again.",
          failedContent: content,
          failedAttachments: attachments,
        });
        setStatus("error");
        return;
      }
    }

    if (!convId) return;

    // Save failed prompt for retry
    lastFailedPromptRef.current = { content, attachments };
    setErrorInfo(null);

    // Append user message optimistically only if not a retry
    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `client-msg-${Date.now()}`,
        conversationId: convId,
        role: "user",
        content,
        model: currentModel,
        attachments,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    // Clear any active edit draft
    if (editingMessageContent) {
      setEditingMessageContent("");
    }

    setStatus("submitting");
    setStreamingContent("");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          content,
          model: currentModel,
          attachments,
          isRetry,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        if (res.status === 401) {
          setUser(null);
          setAuthModalOpen(true);
        }
        const errorData = await res.json().catch(() => ({}));
        setErrorInfo({
          code: errorData.code || "AI_PROVIDER_ERROR",
          message:
            errorData.error ||
            "GENZ-AI is temporarily unable to generate a response. Please try again.",
          failedContent: content,
          failedAttachments: attachments,
        });
        setStatus("error");
        setStreamingContent("");
        return;
      }

      setStatus("streaming");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";
      let incomingImages: ImageItem[] | undefined = undefined;
      let incomingSources: SearchSource[] | undefined = undefined;
      let incomingResearchSteps: ResearchStep[] | undefined = undefined;
      let incomingType: "text" | "image" | "search" | "research" = "text";
      let responseModel: string = currentModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                setErrorInfo({
                  code: parsed.code || "AI_PROVIDER_ERROR",
                  message: parsed.error,
                  failedContent: content,
                  failedAttachments: attachments,
                });
                setStatus("error");
                setStreamingContent("");
                return;
              } else if (parsed.type === "sources" && parsed.sources) {
                incomingSources = parsed.sources;
              } else if (parsed.type === "research") {
                incomingType = "research";
                responseModel = "genz-reasoning";
                if (parsed.sources) incomingSources = parsed.sources;
                if (parsed.steps) incomingResearchSteps = parsed.steps;
                if (parsed.text) {
                  accumulated = parsed.text;
                  setStreamingContent(accumulated);
                }
              } else if (parsed.type === "research_step") {
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingContent(accumulated);
                }
              } else if (parsed.type === "status") {
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingContent(accumulated);
                }
              } else if (parsed.type === "image" && parsed.images) {
                incomingType = "image";
                incomingImages = parsed.images;
                if (parsed.text) {
                  accumulated = parsed.text;
                  setStreamingContent(accumulated);
                }
                if (parsed.mode === "search") {
                  responseModel = "genz-search";
                } else if (parsed.mode === "generate") {
                  responseModel = "genz-creative";
                }
              } else if (parsed.text) {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              }
            } catch {
              // Ignore non-JSON chunks
            }
          }
        }
      }

      // Generation completed successfully with real AI content
      if (accumulated.trim() || (incomingImages && incomingImages.length > 0)) {
        const assistantMsg: ChatMessage = {
          id: `assistant-msg-${Date.now()}`,
          conversationId: convId,
          role: "assistant",
          content: accumulated,
          type: incomingType,
          images: incomingImages,
          sources: incomingSources,
          researchSteps: incomingResearchSteps,
          model: responseModel,
          createdAt: new Date(),
          attachments: incomingImages
            ? incomingImages.map((img) => ({
                filename: img.alt || "image.jpg",
                mimeType: "image/jpeg",
                size: 150000,
                url: img.url,
              }))
            : undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent("");
        setStatus("completed");
        lastFailedPromptRef.current = null;
        await loadConversations();
        await loadUserSettings();
      } else {
        setStatus("completed");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Stream aborted by user");
      } else {
        console.error("Chat streaming error:", err);
        setErrorInfo({
          code: "AI_PROVIDER_ERROR",
          message:
            "GENZ-AI encountered an error communicating with the AI service. Please try again.",
          failedContent: content,
          failedAttachments: attachments,
        });
        setStatus("error");
        setStreamingContent("");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    if (lastFailedPromptRef.current) {
      handleSendMessage(
        lastFailedPromptRef.current.content,
        lastFailedPromptRef.current.attachments,
        true
      );
    }
  };

  // Regenerate last response
  const handleRegenerateLast = () => {
    const lastUserIndex = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;

    const lastUserMsg = messages[lastUserIndex];
    // Keep up to and including the user message
    setMessages((prev) => prev.slice(0, lastUserIndex + 1));
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachments, true);
  };

  // Edit user message
  const handleEditMessage = (content: string) => {
    setEditingMessageContent(content);
  };

  // Save Settings
  const handleSaveSettings = async (
    newSettings: Partial<UserSettings>,
    name?: string
  ) => {
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: newSettings, name }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        if (name && user) {
          setUser({ ...user, name });
        }
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try {
        localStorage.setItem("genz_logged_out", "true");
      } catch {}
      setUser(null);
      setConversations([]);
      handleNewChat();
      setAuthErrorMessage(null);
      setAuthModalOpen(true);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0 h-full">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          user={user}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={handleLogout}
          onOpenAuth={() => {
            setAuthErrorMessage(null);
            setAuthModalOpen(true);
          }}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        user={user}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthErrorMessage(null);
          setAuthModalOpen(true);
        }}
      />

      {/* Main Conversation Window */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        <ChatHeader
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <MessageList
          messages={messages}
          status={status}
          streamingContent={streamingContent}
          errorInfo={errorInfo}
          onRetry={handleRetry}
          onRegenerateLast={handleRegenerateLast}
          onSelectStarter={(prompt) => handleSendMessage(prompt)}
          onEditMessage={handleEditMessage}
          autoScrollEnabled={settings.autoScroll}
          currentModel={currentModel}
        />

        <Composer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          status={status}
          enterToSend={settings.enterToSend}
          modelName={currentModel}
          initialValue={editingMessageContent}
          onCancelEdit={() => setEditingMessageContent("")}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        usageStats={usageStats}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthErrorMessage(null);
        }}
        errorMessage={authErrorMessage}
        onClearError={() => setAuthErrorMessage(null)}
        onAuthSuccess={(authUser) => {
          setUser(authUser);
          setActiveId(undefined);
          setMessages([]);
          try {
            localStorage.removeItem("genz_logged_out");
          } catch {}
          loadConversations();
          loadUserSettings();
        }}
      />
    </div>
  );
}
