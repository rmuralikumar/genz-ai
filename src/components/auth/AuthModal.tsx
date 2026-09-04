"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { UserProfile } from "@/types/chat";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: UserProfile) => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({
  isOpen,
  onClose,
  errorMessage = null,
  onClearError,
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (errorMessage) {
      setLocalError(errorMessage);
    }
  }, [errorMessage]);

  if (!isOpen) return null;

  const displayError = localError || errorMessage;

  const handleGoogleSignIn = () => {
    setLoading(true);
    setLocalError(null);
    if (onClearError) onClearError();

    // Redirect to the Google OAuth initiation endpoint
    window.location.href = "/api/auth/google";
  };

  const handleClose = () => {
    setLocalError(null);
    if (onClearError) onClearError();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in"
        onClick={handleClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 bg-black flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="GENZ-AI Logo"
              width={56}
              height={56}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Welcome back to GENZ-AI
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed max-w-xs">
            Sign in to access your chat history and custom preferences.
          </p>
        </div>

        {/* Error Notification */}
        {displayError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{displayError}</span>
          </div>
        )}

        {/* Prominent Google Sign-in Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-3 border border-gray-200/80 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-gray-700 shrink-0" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleLogo className="w-5 h-5 shrink-0" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
