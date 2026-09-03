import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GENZ-AI — Your AI Assistant",
  description:
    "A modern conversational AI assistant engineered for speed, reasoning, and beautiful responsive experience across mobile and desktop.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "GENZ-AI — Your AI Assistant",
    description: "Intelligent, responsive conversational AI assistant.",
    siteName: "GENZ-AI",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark" suppressHydrationWarning>
      <body className="h-full flex flex-col m-0 p-0 overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
