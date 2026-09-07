import type { Metadata, Viewport } from "next";
import Script from "next/script";
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
    <html lang="en" className="h-full antialiased dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var savedTheme = localStorage.getItem('genz_theme');
    var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = savedTheme;
    if (!theme || theme === 'system') {
      theme = supportDarkMode ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`,
          }}
        />
      </head>
      <body className="h-full flex flex-col m-0 p-0 overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
        {children}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "yep9fbaumx");
            `,
          }}
        />
      </body>
    </html>
  );
}
