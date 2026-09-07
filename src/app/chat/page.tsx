import { AppShell } from "@/components/layout/AppShell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat — GENZ-AI",
  description:
    "Intelligent conversational workspace with live streaming, web search, image generation, document analysis, and media synthesis.",
};

export default function ChatPage() {
  return <AppShell />;
}
