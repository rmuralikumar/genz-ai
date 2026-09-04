/**
 * GENZ-AI Web Search Engine
 * Multi-tier real-time web search with Google Custom Search API and zero-key DuckDuckGo/Wikipedia fallback.
 */

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  provider: "google" | "duckduckgo" | "wikipedia" | "fallback";
}

/**
 * Detects if a user query requires real-time web search.
 */
export function detectWebSearchIntent(input: string): {
  isSearch: boolean;
  searchQuery: string;
  reason?: string;
} {
  if (!input) return { isSearch: false, searchQuery: "" };
  const trimmed = input.trim();
  if (trimmed.length < 4) return { isSearch: false, searchQuery: "" };

  const lower = trimmed.toLowerCase();

  // Explicit search triggers
  const explicitPrefixes = [
    /^search\s+(the\s+)?(web|internet|google|online)\s+(for\s+)?/i,
    /^(please\s+)?search\s+for\s+/i,
    /^(please\s+)?find\s+(the\s+)?(latest|current|recent|newest)\s+/i,
    /^(can\s+you\s+)?search\s+/i,
    /^(look\s+up|google)\s+/i,
    /^check\s+(the\s+)?(news|web|internet)\s+for\s+/i,
  ];

  for (const regex of explicitPrefixes) {
    if (regex.test(lower)) {
      const query = lower.replace(regex, "").trim();
      return { isSearch: true, searchQuery: query || trimmed, reason: "explicit_search" };
    }
  }

  // Temporal keywords indicating current/live information
  const temporalKeywords = [
    /\blatest\b/i,
    /\bnews\b/i,
    /\btoday('?s)?\b/i,
    /\byesterday('?s)?\b/i,
    /\bthis\s+week\b/i,
    /\bthis\s+month\b/i,
    /\bcurrent\s+(price|status|version|news|update|events?)\b/i,
    /\bprice\s+of\b/i,
    /\bwho\s+won\b/i,
    /\bmatch\s+(today|yesterday|score)\b/i,
    /\bscore\s+of\b/i,
    /\bwhat\s+happened\s+(today|in|to)\b/i,
    /\brecent\s+(news|events|developments|breakthroughs)\b/i,
    /\breleased\s+(today|recently|this\s+year)\b/i,
    /\bweather\s+(today|tomorrow|in)\b/i,
    /\bstock\s+price\b/i,
  ];

  const hasTemporal = temporalKeywords.some((r) => r.test(lower));

  // Tanglish / Tamil search triggers
  const tanglishSearchPatterns = [
    /innaiku\s+enna\s+nadandhadhu/i,
    /today\s+news\s+enna/i,
    /enna\s+news\s+bro/i,
    /latest\s+update\s+sollu/i,
    /search\s+panni\s+sollu/i,
  ];

  const hasTanglishSearch = tanglishSearchPatterns.some((r) => r.test(lower));

  if (hasTemporal || hasTanglishSearch) {
    // Clean query
    const cleaned = trimmed
      .replace(/^(what is|tell me|who is|show me|can you tell me|sollu|bro)\s+/i, "")
      .trim();
    return { isSearch: true, searchQuery: cleaned || trimmed, reason: "temporal_intent" };
  }

  return { isSearch: false, searchQuery: "" };
}

/**
 * Searches the web using configured provider or free fallback.
 */
export async function performWebSearch(query: string, maxResults = 5): Promise<WebSearchResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { query, results: [], provider: "fallback" };
  }

  // Tier 1: Google Custom Search API if keys configured
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const googleEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (googleApiKey && googleEngineId) {
    try {
      const googleResults = await searchGoogle(cleanQuery, googleApiKey, googleEngineId, maxResults);
      if (googleResults.length > 0) {
        return { query: cleanQuery, results: googleResults, provider: "google" };
      }
    } catch (err) {
      console.warn("Google Custom Search failed, falling back to DuckDuckGo:", err);
    }
  }

  // Tier 2: DuckDuckGo HTML Search
  try {
    const ddgResults = await searchDuckDuckGo(cleanQuery, maxResults);
    if (ddgResults.length > 0) {
      return { query: cleanQuery, results: ddgResults, provider: "duckduckgo" };
    }
  } catch (err) {
    console.warn("DuckDuckGo search failed, falling back to Wikipedia:", err);
  }

  // Tier 3: Wikipedia OpenSearch API
  try {
    const wikiResults = await searchWikipedia(cleanQuery, maxResults);
    if (wikiResults.length > 0) {
      return { query: cleanQuery, results: wikiResults, provider: "wikipedia" };
    }
  } catch (err) {
    console.warn("Wikipedia search failed:", err);
  }

  return { query: cleanQuery, results: [], provider: "fallback" };
}

/**
 * Google Custom Search Provider
 */
async function searchGoogle(
  query: string,
  apiKey: string,
  engineId: string,
  limit: number
): Promise<SearchResult[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(
    query
  )}&num=${limit}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw new Error(`Google Search API responded with status ${res.status}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.slice(0, limit).map((item: { title: string; link: string; snippet: string; displayLink?: string }, idx: number) => ({
    id: idx + 1,
    title: item.title,
    url: item.link,
    snippet: item.snippet || "",
    source: item.displayLink || new URL(item.link).hostname,
  }));
}

/**
 * DuckDuckGo HTML Search Provider
 */
async function searchDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) {
    throw new Error(`DuckDuckGo responded with status ${res.status}`);
  }

  const html = await res.text();
  const results: SearchResult[] = [];

  // Match result snippets and uddg URLs
  const snippetMatches = [...html.matchAll(/<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const titleMatches = [...html.matchAll(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (let i = 0; i < snippetMatches.length && results.length < limit; i++) {
    const rawHref = snippetMatches[i][1] || "";
    const rawSnippet = snippetMatches[i][2] || "";
    const rawTitle = titleMatches[i] ? titleMatches[i][2] : "";

    // Extract actual URL from DuckDuckGo redirect uddg parameter
    let finalUrl = rawHref;
    const uddgMatch = rawHref.match(/[?&]uddg=([^&]+)/);
    if (uddgMatch) {
      try {
        finalUrl = decodeURIComponent(uddgMatch[1]);
      } catch {
        // fallback to rawHref
      }
    }

    if (!finalUrl.startsWith("http")) continue;

    const cleanTitle = rawTitle.replace(/<[^>]+>/g, "").trim() || new URL(finalUrl).hostname;
    const cleanSnippet = rawSnippet.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").trim();

    results.push({
      id: results.length + 1,
      title: cleanTitle,
      url: finalUrl,
      snippet: cleanSnippet,
      source: new URL(finalUrl).hostname.replace(/^www\./, ""),
    });
  }

  return results;
}

/**
 * Wikipedia API Search Provider
 */
async function searchWikipedia(query: string, limit: number): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&utf8=&format=json`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return [];

  const data = await res.json();
  const searchItems = data.query?.search || [];

  return searchItems.slice(0, limit).map((item: { title: string; snippet: string }, idx: number) => {
    const title = item.title;
    const cleanSnippet = (item.snippet || "").replace(/<[^>]+>/g, "").trim();
    const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

    return {
      id: idx + 1,
      title,
      url: pageUrl,
      snippet: cleanSnippet,
      source: "wikipedia.org",
    };
  });
}

/**
 * Builds the search prompt augment for the LLM with strict citation guidelines.
 */
export function buildSearchAugmentedPrompt(
  userPrompt: string,
  searchResponse: WebSearchResponse
): string {
  if (!searchResponse.results || searchResponse.results.length === 0) {
    return userPrompt;
  }

  const sourcesBlock = searchResponse.results
    .map(
      (r) =>
        `[${r.id}] Title: ${r.title}\nSource: ${r.source}\nURL: ${r.url}\nExcerpt: ${r.snippet}`
    )
    .join("\n\n");

  return `Current Real-Time Web Search Results for query: "${searchResponse.query}"\n\n${sourcesBlock}\n\n=== User Request ===\n${userPrompt}\n\n=== Instructions ===\nAnswer the user's question using the provided web search results.\n1. Be factual, concise, and up to date based on the search results.\n2. Cite your sources directly using clickable markdown links in the format: [[${1}](${searchResponse.results[0]?.url})] or [[Source Name](${searchResponse.results[0]?.url})].\n3. Never fabricate or hallucinate facts or URLs not found in the search results.\n4. If the results do not contain enough information, honestly state what is available.`;
}
