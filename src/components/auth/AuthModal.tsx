"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User, Bot, AlertCircle } from "lucide-react";
import { UserProfile } from "@/types/chat";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 z-10 animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-3 ring-1 ring-white/20">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isLogin ? "Welcome back to GENZ-AI" : "Join GENZ-AI"}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isLogin
              ? "Sign in to access your chat history and custom preferences."
              : "Create an account to persist conversations across devices."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Hunter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:border-[var(--accent-primary)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-[var(--text-muted)]">
          {isLogin ? "Don't have an account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-[var(--accent-primary)] hover:underline font-semibold ml-1"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
