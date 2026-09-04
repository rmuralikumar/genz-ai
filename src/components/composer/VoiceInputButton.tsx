"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

interface IWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function VoiceInputButton({
  onTranscription,
  disabled,
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const win = typeof window !== "undefined" ? (window as unknown as IWindow) : null;
    const SpeechRecognitionClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript.trim()) {
          onTranscription(transcript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [onTranscription]);

  const handleToggleVoice = async () => {
    if (disabled) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Try Web Speech API first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (err) {
        console.warn("Could not start Web Speech, trying MediaRecorder fallback:", err);
      }
    }

    // Fallback: MediaRecorder sending to /api/voice/transcribe
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setIsListening(false);
          setIsProcessing(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach((track) => track.stop());

          try {
            const formData = new FormData();
            formData.append("file", audioBlob, "speech.webm");

            const res = await fetch("/api/voice/transcribe", {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              if (data.text) {
                onTranscription(data.text);
              }
            } else {
              const errData = await res.json().catch(() => ({}));
              console.warn("Transcription server error:", errData.error);
            }
          } catch (uploadErr) {
            console.error("Failed to upload audio chunk:", uploadErr);
          } finally {
            setIsProcessing(false);
          }
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (micErr) {
        console.error("Microphone access denied:", micErr);
        alert("Microphone permission was denied. Please allow microphone access in your browser settings.");
        setIsListening(false);
      }
    } else {
      alert("Voice input is not supported in this browser environment.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      disabled={disabled || isProcessing}
      title={isListening ? "Listening... click to stop" : isProcessing ? "Processing speech..." : "Voice input (Microphone)"}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
      className={`relative p-2 rounded-xl transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] ${
        isListening
          ? "bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/50 animate-pulse"
          : isProcessing
          ? "bg-[var(--accent-glow)] text-[var(--accent-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
      }`}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
      ) : isListening ? (
        <span className="relative flex items-center justify-center">
          <Mic className="w-5 h-5 text-rose-400" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </span>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}
