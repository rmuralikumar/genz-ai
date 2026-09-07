import type { Metadata } from "next";

export const siteConfig = {
  name: "GENZ-AI",
  shortName: "GENZ-AI",
  title: "GENZ-AI — Intelligent Multimodal Conversational AI",
  description:
    "GENZ-AI is an intelligent multimodal AI platform for conversational AI, web search, image generation, document analysis, voice, video generation, and deep research.",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, ""),
  ogImage: "/og-image.png",
  keywords: [
    "conversational AI",
    "multimodal AI",
    "AI workspace",
    "deep research",
    "AI web search",
    "image generation",
    "document analysis",
    "vision AI",
    "voice transcription",
    "text-to-speech",
    "video generation",
    "Ollama AI",
  ],
  authors: [
    {
      name: "GENZ-AI Team",
      url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, ""),
    },
  ],
  creator: "GENZ-AI",
  publisher: "GENZ-AI",
  locale: "en_US",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
};

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is GENZ-AI?",
    answer:
      "GENZ-AI is an intelligent multimodal conversational AI platform uniting streaming reasoning, photorealistic image creation, live web search, deep investigative research, document analysis, voice transcription, and video synthesis into a unified modern workspace.",
  },
  {
    question: "What can GENZ-AI do?",
    answer:
      "GENZ-AI handles conversational reasoning, code generation with syntax highlighting, live web search with citations, multi-step deep research, PDF, Word, and Excel spreadsheet analysis, vision analysis, voice recording dictation, natural text-to-speech, and AI video studio keyframing.",
  },
  {
    question: "How does GENZ-AI work?",
    answer:
      "GENZ-AI leverages an autonomous intent-detection pipeline that determines whether a prompt requires natural dialogue, real-time internet search, document data extraction, math calculations, visual synthesis, or video keyframing, streaming results back via Server-Sent Events (SSE).",
  },
  {
    question: "Does GENZ-AI support image generation?",
    answer:
      "Yes. GENZ-AI includes zero-cost, high-resolution image generation powered by FLUX AI models with prompt fidelity and automatic DALL-E 3 fallback for photorealistic concept art and visual assets.",
  },
  {
    question: "Does GENZ-AI support real-time web search?",
    answer:
      "Yes. GENZ-AI executes live web searches to fetch up-to-date facts, current news, and documentation, providing interactive source drawers with verified citations.",
  },
  {
    question: "Can GENZ-AI analyze documents and spreadsheets?",
    answer:
      "Yes. GENZ-AI natively extracts text and tabular structures from uploaded PDF documents, Word (.docx) files, Excel spreadsheets (.xlsx, .xls), CSVs, and source code files for deep analytical querying.",
  },
  {
    question: "Can GENZ-AI generate videos?",
    answer:
      "Yes. GENZ-AI features an integrated AI Video Studio pipeline supporting motion prompt design, free scene keyframing, camera trajectory specification, and multi-tier rendering workflows.",
  },
  {
    question: "What AI models does GENZ-AI support?",
    answer:
      "GENZ-AI is powered by advanced large language models including Ollama Cloud and local models (such as Gemma 3 and Llama 3), with built-in support for multimodal vision and high-performance inference.",
  },
  {
    question: "Are user conversations private and secure?",
    answer:
      "Yes. User conversations, uploaded files, and chat histories are strictly isolated using database-level ownership constraints with Prisma ORM, encrypted JWT authentication, and zero public search engine indexing.",
  },
];

/**
 * Returns a fully qualified absolute URL based on the configured app URL.
 */
export function absoluteUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

/**
 * Helper to construct unified page metadata with standard defaults.
 */
export function constructMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  canonicalUrl,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
} = {}): Metadata {
  const metadataBase = new URL(siteConfig.url);
  const ogImageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    metadataBase,
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.title,
    description,
    applicationName: siteConfig.name,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    publisher: siteConfig.publisher,
    category: "technology",
    keywords: siteConfig.keywords,
    alternates: {
      canonical: canonicalUrl || "/",
    },
    openGraph: {
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.title,
      description,
      url: canonicalUrl ? absoluteUrl(canonicalUrl) : siteConfig.url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title || siteConfig.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${siteConfig.name}` : siteConfig.title,
      description,
      images: [ogImageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

/**
 * Generates the Schema.org JSON-LD graph for the GENZ-AI homepage.
 */
export function getHomepageSchema() {
  const baseUrl = siteConfig.url;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#software`,
        name: siteConfig.name,
        description: siteConfig.description,
        applicationCategory: siteConfig.applicationCategory,
        operatingSystem: siteConfig.operatingSystem,
        url: `${baseUrl}/`,
        image: `${baseUrl}/og-image.png`,
        author: {
          "@type": "Organization",
          name: siteConfig.name,
          url: baseUrl,
        },
        publisher: {
          "@type": "Organization",
          name: siteConfig.name,
          url: baseUrl,
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: siteConfig.name,
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: siteConfig.name,
        url: `${baseUrl}/`,
        description: siteConfig.description,
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}
