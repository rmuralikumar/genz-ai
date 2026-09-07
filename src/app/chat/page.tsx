import { AppShell } from "@/components/layout/AppShell";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Intelligent conversational workspace with live streaming, web search, image generation, document analysis, and media synthesis.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ChatPage() {
  return <AppShell />;
}
