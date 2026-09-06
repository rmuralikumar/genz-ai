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
  lg: { box: "w-11 h-11", img: 44, textSize: "text-xl" },
  xl: { box: "w-14 h-14", img: 56, textSize: "text-2xl" },
};

export function Logo({ size = "md", showText = false, className = "" }: LogoProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative ${currentSize.box} rounded-xl overflow-hidden shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400/40 border border-purple-500/40 bg-black flex items-center justify-center group`}
      >
        <Image
          src="/logo.png"
          alt="GENZ-AI"
          width={currentSize.img}
          height={currentSize.img}
          priority
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Subtle holographic cyan corner highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-cyan-400/20 pointer-events-none" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.25)] ${currentSize.textSize}`}
            >
              GENZ-AI
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff] animate-pulse" />
          </div>
          <span className="text-[9px] font-mono tracking-widest text-cyan-400/70 -mt-1 font-semibold">
            SYS.v2
          </span>
        </div>
      )}
    </div>
  );
}

