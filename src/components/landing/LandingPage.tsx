"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  Globe,
  Search,
  FileText,
  Eye,
  Mic,
  Video,
  ArrowRight,
  Code2,
  BookOpen,
  Palette,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfile } from "@/types/chat";

export function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on mount & handle OAuth callback redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const authSuccess = params.get("auth_success");
      const urlAuthError = params.get("auth_error");

      if (authSuccess) {
        // Clean URL and route straight into chat
        window.history.replaceState({}, document.title, window.location.pathname);
        router.push("/chat");
        return;
      }

      if (urlAuthError) {
        requestAnimationFrame(() => {
          setAuthError(decodeURIComponent(urlAuthError));
          setAuthModalOpen(true);
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Verify current session
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch((err) => {
        console.error("Session verification note:", err);
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, [router]);

  const handleStartChatting = () => {
    if (user) {
      router.push("/chat");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleScrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("features");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-[#060810] text-[#f8fafc] font-sans antialiased selection:bg-purple-500/30 selection:text-cyan-200">
      {/* Subtle Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-purple-600/[0.07] blur-[150px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/[0.05] blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-full">
        {/* =====================================================================
            1. TOP NAVIGATION
        ====================================================================== */}
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060810]/80 backdrop-blur-xl transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size="sm" showText={true} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
              <a
                href="#features"
                onClick={handleScrollToFeatures}
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#built-for-you"
                className="hover:text-white transition-colors"
              >
                Capabilities
              </a>
              <a
                href="#technology"
                className="hover:text-white transition-colors"
              >
                Technology
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => router.push("/chat")}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>Go to Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={handleStartChatting}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Start Chatting</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* =====================================================================
            2. HERO SECTION
        ====================================================================== */}
        <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
          {/* Subtle Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 text-xs font-medium mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomous Multimodal AI Workspace</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">v2.0</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl leading-[1.12]">
            Your AI. One Powerful Workspace.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mb-10 leading-relaxed font-normal">
            GENZ-AI brings conversational reasoning, photorealistic image generation, real-time web search, deep investigative research, document analysis, vision, voice transcription, and multi-tier video generation into a single modern workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto mb-16">
            <button
              type="button"
              onClick={handleStartChatting}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              onClick={handleScrollToFeatures}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-medium text-sm text-zinc-300 border border-white/10 hover:bg-white/[0.05] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Clean Product Showcase Mockup */}
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0a0e1c]/80 backdrop-blur-xl shadow-2xl p-4 sm:p-6 text-left relative overflow-hidden group">
            {/* Header / Dots */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-[11px] text-zinc-500">genz-ai.workspace</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ollama • Active</span>
              </div>
            </div>

            {/* Conversation Preview Demo */}
            <div className="space-y-4 font-sans text-xs sm:text-sm">
              {/* User Prompt */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-xs font-semibold text-zinc-300">
                  U
                </div>
                <div className="bg-zinc-800/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-zinc-200">
                  Analyze the Q3 performance dataset, find current industry trends on the web, and draft a video scene spec.
                </div>
              </div>

              {/* Assistant Tool Execution Pipeline */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="space-y-2 flex-1">
                  {/* Tool chips */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> parsed dataset.xlsx
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> 4 verified web sources
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-300 flex items-center gap-1">
                      <Video className="w-3 h-3" /> video scene generated
                    </span>
                  </div>

                  <div className="bg-[#0e1326]/60 border border-white/[0.06] rounded-xl p-3.5 text-zinc-300 space-y-2 text-xs sm:text-sm leading-relaxed">
                    <p>
                      <strong>Summary Analysis:</strong> Q3 data demonstrates a <strong>28.4% increase</strong> in operational efficiency. Web sources confirm this outperforms industry benchmarks by 12 points.
                    </p>
                    <p className="text-zinc-400">
                      🎬 <strong>AI Video Studio Scene Keyframe:</strong> Prepared cinematic 24fps motion storyboard with dynamic camera sweep across holographic metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. CORE CAPABILITIES (FEATURES SECTION)
        ====================================================================== */}
        <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Comprehensive AI Toolkit
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Every specialized capability is integrated into a unified chat interface with autonomous intent resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                icon: MessageSquare,
                title: "AI Chat",
                desc: "Natural conversational reasoning, fast SSE streaming, code synthesis, and multi-turn context retention.",
                tag: "Conversational",
              },
              {
                icon: Sparkles,
                title: "Image Generation",
                desc: "Zero-cost high-resolution visual creation powered by FLUX AI with prompt fidelity and DALL-E 3 fallback.",
                tag: "Creative",
              },
              {
                icon: Globe,
                title: "Web Search",
                desc: "Live internet query execution with verified factual citations and interactive source drawers.",
                tag: "Real-time",
              },
              {
                icon: Search,
                title: "Deep Research",
                desc: "Multi-step analytical exploration that investigates complex topics with systematic breakdown.",
                tag: "Analytical",
              },
              {
                icon: FileText,
                title: "File Analysis",
                desc: "Native extraction and insight generation for PDFs, Word files, Excel spreadsheets, CSVs, and source code.",
                tag: "Productivity",
              },
              {
                icon: Eye,
                title: "Vision",
                desc: "Multimodal visual inspection, diagram explanation, screenshot interpretation, and visual question answering.",
                tag: "Multimodal",
              },
              {
                icon: Mic,
                title: "Voice",
                desc: "Hands-free speech recording, automated transcription, and natural text-to-speech audio playback.",
                tag: "Audio",
              },
              {
                icon: Video,
                title: "Video Studio",
                desc: "Multi-provider video engine with free scene keyframes, camera motion specifications, and GPU rendering options.",
                tag: "Media",
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between hover:border-white/20 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:border-purple-500/40 transition-colors">
                        <Icon className="w-5 h-5 text-zinc-200 group-hover:text-purple-300 transition-colors" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 py-0.5 rounded border border-white/5">
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base text-white mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            4. "BUILT FOR EVERYTHING YOU CREATE" SECTION
        ====================================================================== */}
        <section id="built-for-you" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Built for everything you create
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Engineered to adapt to your workflow whether you are architecting software, researching data, or producing creative media.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                  <Code2 className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Developers & Engineers
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Generate clean code, debug syntax errors, understand complex algorithmic structures, and evaluate math formulas with deterministic precision.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-white/[0.06] pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Syntax highlighting with one-click code copying</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Built-in deterministic calculator tool</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                  <BookOpen className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Researchers & Analysts
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Investigate deep market trends, inspect PDFs and spreadsheets directly, and gather factual verification from live web search with clear source citations.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-white/[0.06] pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Live internet search with verified source drawers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Multi-format document parsing (PDF, DOCX, XLSX)</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-5">
                  <Palette className="w-5 h-5 text-pink-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Creators & Designers
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Synthesize photorealistic concept art via FLUX, draft storyboard keyframes, specify dynamic camera angles, and search photography from Wikipedia and Unsplash.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-white/[0.06] pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Zero-cost high-resolution FLUX image generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Multi-provider AI video studio pipeline</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <BarChart3 className="w-5 h-5 text-emerald-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Productivity & Communication
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Fluid multilingual dialogue across English, Tamil, and Tanglish. Dictate prompts via voice recording and listen back with natural text-to-speech audio.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-white/[0.06] pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Integrated voice transcription & text-to-speech</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cloud persistence with Neon PostgreSQL & Prisma</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. TECHNOLOGY SECTION
        ====================================================================== */}
        <section id="technology" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06] text-center">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6">
            Powered By Modern Infrastructure
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-zinc-300">
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Next.js 16 (App Router)
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              React 19
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Neon PostgreSQL
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Prisma ORM
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Ollama Cloud
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Google OAuth 2.0
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02]">
              Tailwind CSS
            </span>
          </div>
        </section>

        {/* =====================================================================
            6. BOTTOM CTA
        ====================================================================== */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center border-t border-white/[0.06]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 sm:p-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Ready to experience GENZ-AI?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Start chatting now with intelligent reasoning, live search, document understanding, and media generation.
            </p>
            <button
              type="button"
              onClick={handleStartChatting}
              className="px-8 py-4 rounded-xl font-semibold text-sm bg-white text-black hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-xl shadow-white/10 active:scale-[0.98]"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* =====================================================================
            7. MINIMAL FOOTER
        ====================================================================== */}
        <footer className="mt-auto border-t border-white/[0.08] py-8 px-4 sm:px-6 bg-[#04060d]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2.5">
              <Logo size="xs" showText={true} />
              <span className="text-zinc-600">|</span>
              <span>Intelligent Conversational Workspace</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                onClick={handleScrollToFeatures}
                className="hover:text-zinc-300 transition-colors"
              >
                Features
              </a>
              <a
                href="#built-for-you"
                className="hover:text-zinc-300 transition-colors"
              >
                Capabilities
              </a>
              <span className="text-zinc-600">•</span>
              <span>© {new Date().getFullYear()} GENZ-AI. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Existing Auth Modal (Google OAuth & Session Flow) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthError(null);
        }}
        errorMessage={authError}
        onClearError={() => setAuthError(null)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAuthModalOpen(false);
          router.push("/chat");
        }}
      />
    </div>
  );
}
