import { LandingPage } from "@/components/landing/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GENZ-AI — Your AI. One Powerful Workspace.",
  description:
    "An intelligent conversational workspace unifying AI chat, image generation, web search, deep research, file analysis, vision, voice transcription, and multi-tier video generation.",
};

export default function HomePage() {
  return <LandingPage />;
}
