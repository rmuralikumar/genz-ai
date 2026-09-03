import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { box: "w-6 h-6", img: 24, textSize: "text-xs" },
  sm: { box: "w-7 h-7", img: 28, textSize: "text-sm" },
  md: { box: "w-8 h-8", img: 32, textSize: "text-base" },
  lg: { box: "w-12 h-12", img: 48, textSize: "text-xl" },
  xl: { box: "w-16 h-16", img: 64, textSize: "text-2xl" },
};

export function Logo({ size = "md", showText = false, className = "" }: LogoProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${currentSize.box} rounded-xl overflow-hidden shrink-0 shadow-md shadow-indigo-500/20 ring-1 ring-white/20 bg-black flex items-center justify-center`}
      >
        <Image
          src="/logo.png"
          alt="GENZ-AI Logo"
          width={currentSize.img}
          height={currentSize.img}
          priority
          className="w-full h-full object-cover"
        />
      </div>
      {showText && (
        <span
          className={`font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent ${currentSize.textSize}`}
        >
          GENZ-AI
        </span>
      )}
    </div>
  );
}
