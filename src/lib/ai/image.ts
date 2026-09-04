/**
 * GENZ-AI Image Engine: Search & Generative AI Studio
 * Supports natural language prompts in English, Tamil, and Tanglish.
 * Multi-tier photo search (Wikipedia, Wikimedia Commons, Unsplash, Google Search)
 * and generative models (Pollinations FLUX, OpenAI DALL-E 3).
 */

export interface DetectedImageIntent {
  isImageRequest: boolean;
  mode: "search" | "generate" | "none";
  prompt: string;
}

export interface ImageResultItem {
  url: string;
  thumbnail?: string;
  title: string;
  source: string;
  author?: string;
  alt?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Detects whether a user message is requesting a real photo/search OR an AI image generation.
 * Distinguishes search queries ("actor surya photo snd panu", "send me a photo of Vijay", "show me a Ferrari")
 * from generative requests ("generate a futuristic city", "create a picture of a cat").
 */
export function detectImageIntent(input: string): DetectedImageIntent {
  if (!input) return { isImageRequest: false, mode: "none", prompt: "" };

  const raw = input.trim();
  if (raw.length < 3) return { isImageRequest: false, mode: "none", prompt: "" };

  // Negative guards: programming questions, tutorials, code requests, instructions
  if (
    /^(?:show\s+me|give\s+me|send\s+me)\s+(?:how\s+to|an?\s+example|code|steps|a\s+way|a\s+solution|the\s+difference|documentation|details)/i.test(
      raw
    )
  ) {
    return { isImageRequest: false, mode: "none", prompt: "" };
  }

  // 1. GENERATIVE INTENT (AI generation, digital art, drawings, synthesis)
  const genPatterns = [
    // generate/create/make/render an image/photo of X
    /^(?:please\s+)?(?:generate|create|make|render)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:image|img|picture|pic|photo|artwork|illustration|drawing|portrait|wallpaper)\s+(?:of|for|about)?\s*(.+)$/i,
    // draw/paint/sketch/illustrate me X
    /^(?:please\s+)?(?:draw|paint|sketch|illustrate)\s+(?:me\s+)?(?:an?|the|some)?\s*(.+)$/i,
    // generate a futuristic city (direct without explicit image keyword)
    /^(?:please\s+)?(?:generate|render)\s+(?:an?|the|some)?\s*(.+)$/i,
    // create a picture of a cat / create an image of X
    /^(?:please\s+)?create\s+(?:an?|the|some)?\s*(?:picture|image|img|pic|photo|drawing|illustration|artwork)\s+(?:of|for)?\s*(.+)$/i,
    // anime/digital art/3d render/concept art of X
    /^(?:please\s+)?(?:an?|the)?\s*(?:anime(?:\s+style)?|3d\s+render|digital\s+art|concept\s+art)\s+(?:of|for)?\s*(.+)$/i,
    // Tanglish generative: [subject] image create pannu / generate pannu / drawing podu
    /^(.+?)\s+(?:image|img|picture|pic|photo|drawing|art)\s*(?:create\s+pannu|generate\s+pannu|varai|draw\s+pannu)/i,
  ];

  for (const pattern of genPatterns) {
    const match = raw.match(pattern);
    if (match) {
      let extracted = (match[1] || "").trim();
      extracted = cleanPromptString(extracted);
      if (extracted.length >= 2) {
        return { isImageRequest: true, mode: "generate", prompt: extracted };
      }
    }
  }

  // 2. PHOTO SEARCH INTENT (Real photos, pictures of people, actors, animals, cars, places, etc.)
  const searchPatterns = [
    // actor surya photo snd panu / send me photo / photo anupu / pic podu
    /^(?:please\s+)?(?:send|snd|give|show|find|search|get)\s+(?:me\s+)?(?:an?|the|some)?\s*(?:image|img|picture|pic|photo|wallpaper|photograph)\s+(?:of|for|about)?\s*(.+)$/i,
    // photo of X / picture of X / image of X
    /^(?:an?|the\s+)?(?:image|img|picture|pic|photo|photograph|wallpaper)\s+(?:of|for|about)\s+(.+)$/i,
    // Tanglish: [subject] photo/pic/img [verb: snd panu / send panu / anupu / kaatu / kudu / podu / venum]
    /^(.+?)\s+(?:photo|pic|img|image)\s+(?:snd\s+panu|send\s+panu|send\s+pannu|anupu|anupunga|kaatu|kattunga|kudu|podu|venum|thanga)(?:\s+please|\s+pls|\s+bro|\s+machi|\s+da)?$/i,
    // [subject] photo / [subject] pic / [subject] img (e.g. "actor surya photo", "tiger pic")
    /^(.+?)\s+(?:image|img|picture|pic|photo)$/i,
    // send me a photo of X / send me X photo
    /^(?:please\s+)?(?:send|snd|show|give|find|search)\s+(?:me\s+)?(.+?)\s+(?:image|img|picture|pic|photo)$/i,
    // show me a Ferrari / show me Ferrari
    /^(?:please\s+)?(?:show|display)\s+(?:me\s+)?(?:an?|the\s+)?([a-zA-Z0-9\s]{2,40})$/i,
    // find a photo of X
    /^(?:please\s+)?find\s+(?:me\s+)?(?:an?|the\s+)?(?:photo|picture|image|pic)\s+(?:of\s+)?(.+)$/i,
  ];

  for (const pattern of searchPatterns) {
    const match = raw.match(pattern);
    if (match) {
      let extracted = (match[1] || "").trim();
      extracted = cleanPromptString(extracted);
      if (extracted.length >= 2) {
        return { isImageRequest: true, mode: "search", prompt: extracted };
      }
    }
  }

  return { isImageRequest: false, mode: "none", prompt: "" };
}

/**
 * Strips conversational fluff and prefixes from extracted image prompts.
 */
function cleanPromptString(str: string): string {
  return str
    .replace(/^(?:of|for|about|a|an|the)\s+/i, "")
    .replace(/\s+(?:please|pls|bro|machi|da|thala|thalaiva)$/i, "")
    .replace(/^(?:oru\s+)/i, "")
    .trim();
}

/**
 * Searches real photo databases with automatic fallback chain:
 * 1. Google Custom Search (if API keys set in .env)
 * 2. Wikipedia / Wikimedia Page Images API (encyclopedic photos of actors, celebrities, animals, vehicles)
 * 3. Wikimedia Commons Direct Search API (for community-contributed media & photographers)
 * 4. Unsplash Public Search API (high-resolution photography)
 */
export async function searchImages(query: string): Promise<ImageResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. Google Custom Search (if configured in environment)
  const googleKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleCx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (googleKey && googleCx) {
    try {
      const googleUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
        cleanQuery
      )}&cx=${googleCx}&key=${googleKey}&searchType=image&num=3&safe=active`;
      const gRes = await fetch(googleUrl, { signal: AbortSignal.timeout(6000) });
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          return gData.items.map((item: { link: string; title?: string; image?: { thumbnailLink?: string }; displayLink?: string }) => ({
            url: item.link,
            thumbnail: item.image?.thumbnailLink || item.link,
            title: item.title || cleanQuery,
            alt: item.title || cleanQuery,
            source: "Google Search",
            author: item.displayLink || undefined,
            mimeType: "image/jpeg",
          }));
        }
      }
    } catch (gErr) {
      console.warn("Google Image Search failed, falling back to Wikimedia:", gErr);
    }
  }

  // 2. Wikipedia / Wikimedia Commons API (Fast, encyclopedic, verified real photos)
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrlimit=6&prop=pageimages|extracts&piprop=original|thumbnail&pithumbsize=1000&format=json&origin=*`;

    const wikiRes = await fetch(wikiUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "GENZ-AI-ChatApp/1.0 (https://github.com/murali/genz-ai)" },
    });

    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData?.query?.pages) {
        interface WikiPage {
          title: string;
          original?: { source: string };
          thumbnail?: { source: string };
        }
        const pages = Object.values(wikiData.query.pages) as WikiPage[];
        const results: ImageResultItem[] = [];

        for (const page of pages) {
          const imgUrl = page.original?.source || page.thumbnail?.source;
          if (imgUrl && !imgUrl.endsWith(".svg") && !imgUrl.endsWith(".svg.png")) {
            results.push({
              url: imgUrl,
              thumbnail: page.thumbnail?.source || imgUrl,
              title: page.title,
              alt: page.title,
              source: "Wikipedia",
              author: page.title,
              mimeType: "image/jpeg",
            });
          }
        }

        if (results.length > 0) {
          return results.slice(0, 3);
        }
      }
    }
  } catch (wikiErr) {
    console.warn("Wikipedia image search failed, trying Wikimedia Commons fallback:", wikiErr);
  }

  // 3. Wikimedia Commons Direct Search (Community media files & photographer metadata)
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrlimit=5&prop=imageinfo&iiprop=url|user&iiurlwidth=1000&format=json&origin=*`;

    const commonsRes = await fetch(commonsUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "GENZ-AI-ImageService/1.0" },
    });

    if (commonsRes.ok) {
      const commonsData = await commonsRes.json();
      if (commonsData?.query?.pages) {
        interface CommonsPage {
          title: string;
          imageinfo?: Array<{ url: string; thumburl?: string; user?: string }>;
        }
        const pages = Object.values(commonsData.query.pages) as CommonsPage[];
        const results: ImageResultItem[] = [];

        for (const page of pages) {
          const info = page.imageinfo?.[0];
          if (info && info.url && !info.url.endsWith(".svg")) {
            const cleanTitle = page.title.replace(/^File:/i, "").replace(/\.[a-zA-Z0-9]+$/, "");
            results.push({
              url: info.url,
              thumbnail: info.thumburl || info.url,
              title: cleanTitle,
              alt: cleanTitle,
              source: "Wikimedia Commons",
              author: info.user || undefined,
              mimeType: "image/jpeg",
            });
          }
        }

        if (results.length > 0) {
          return results.slice(0, 3);
        }
      }
    }
  } catch (commonsErr) {
    console.warn("Wikimedia Commons search failed, trying Unsplash fallback:", commonsErr);
  }

  // 4. Unsplash Photography Search (High quality real photography of animals, vehicles, landscapes)
  try {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    const unsplashUrl = unsplashKey
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          cleanQuery
        )}&per_page=3&client_id=${unsplashKey}`
      : `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(
          cleanQuery
        )}&per_page=3`;

    const uRes = await fetch(unsplashUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "GENZ-AI-ImageService/1.0" },
    });

    if (uRes.ok) {
      const uData = await uRes.json();
      interface UnsplashItem {
        urls?: { regular?: string; full?: string; small?: string; thumb?: string };
        alt_description?: string;
        description?: string;
        user?: { name?: string; username?: string };
      }
      const items = (uData.results || []) as UnsplashItem[];
      if (items.length > 0) {
        return items.slice(0, 3).map((item) => {
          const title = item.alt_description || item.description || cleanQuery;
          return {
            url: item.urls?.regular || item.urls?.full || item.urls?.small || "",
            thumbnail: item.urls?.small || item.urls?.thumb,
            title,
            alt: title,
            source: "Unsplash",
            author: item.user?.name || item.user?.username || undefined,
            mimeType: "image/jpeg",
          };
        });
      }
    }
  } catch (uErr) {
    console.warn("Unsplash photo search error:", uErr);
  }

  return [];
}

/**
 * Generates an AI image based on the prompt.
 * First checks for optional OPENAI_API_KEY (DALL-E 3).
 * Defaults to high-resolution FLUX image generation via Pollinations AI (free, zero API key required).
 */
export async function generateAiImage(prompt: string): Promise<ImageResultItem> {
  const cleanPrompt = prompt.trim();
  const seed = Math.floor(Math.random() * 10000000);

  // 1. If OpenAI API key is set, attempt DALL-E 3 generation
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey && openAiApiKey.startsWith("sk-")) {
    try {
      const openAiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: cleanPrompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (openAiRes.ok) {
        const data = await openAiRes.json();
        const b64 = data.data?.[0]?.b64_json;
        if (b64) {
          const dataUrl = `data:image/png;base64,${b64}`;
          return {
            url: dataUrl,
            thumbnail: dataUrl,
            title: cleanPrompt,
            alt: cleanPrompt,
            source: "DALL-E 3",
            author: "OpenAI DALL-E 3",
            mimeType: "image/png",
            size: Math.round((b64.length * 3) / 4),
          };
        }
      }
    } catch (openAiErr) {
      console.warn("OpenAI image generation failed, falling back to Pollinations FLUX:", openAiErr);
    }
  }

  // 2. High-Resolution FLUX Engine via Pollinations AI (Free, instant, no key required)
  const encodedPrompt = encodeURIComponent(cleanPrompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  try {
    const imgRes = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(25000),
      headers: {
        "User-Agent": "GENZ-AI-Image-Service/1.0",
      },
    });

    if (imgRes.ok) {
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const base64 = Buffer.from(buffer).toString("base64");
      const dataUrl = `data:${contentType};base64,${base64}`;

      return {
        url: dataUrl,
        thumbnail: dataUrl,
        title: cleanPrompt,
        alt: cleanPrompt,
        source: "FLUX AI",
        author: "Pollinations FLUX",
        mimeType: contentType,
        size: buffer.byteLength,
      };
    }
  } catch (fetchErr) {
    console.warn("Direct buffer fetch failed, utilizing CDN fallback URL:", fetchErr);
  }

  // 3. Fallback: Direct CDN URL
  return {
    url: pollinationsUrl,
    thumbnail: pollinationsUrl,
    title: cleanPrompt,
    alt: cleanPrompt,
    source: "FLUX AI",
    author: "Pollinations FLUX",
    mimeType: "image/jpeg",
    size: 150000,
  };
}
