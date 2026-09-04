async function testWebSearch(query) {
  console.log("Searching for:", query);

  // 1. DuckDuckGo Instant Answer API
  try {
    const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgApiUrl, {
      headers: { "User-Agent": "GENZ-AI-Search/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      console.log("DDG API Abstract:", data.AbstractText?.slice(0, 100));
      console.log("DDG RelatedTopics:", data.RelatedTopics?.length);
    }
  } catch (e) {
    console.warn("DDG API error:", e.message);
  }

  // 2. DuckDuckGo HTML / Lite
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log("DDG HTML Status:", res.status);
    if (res.ok) {
      const html = await res.text();
      // Extract links
      const results = [];
      const linkRegex = /<a[^>]+class="result__snippet"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRegex.exec(html)) !== null && results.length < 5) {
        let rawUrl = m[1];
        if (rawUrl.includes("uddg=")) {
          const uMatch = rawUrl.match(/uddg=([^&]+)/);
          if (uMatch) rawUrl = decodeURIComponent(uMatch[1]);
        }
        const snippet = m[2].replace(/<[^>]+>/g, "").trim();
        results.push({ url: rawUrl, snippet });
      }
      console.log("DDG HTML Results found:", results.length, results.slice(0, 2));
    }
  } catch (e) {
    console.warn("DDG HTML error:", e.message);
  }

  // 3. Wikipedia API
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
    const res = await fetch(wikiUrl);
    if (res.ok) {
      const data = await res.json();
      console.log("Wiki Search Results:", data?.query?.search?.map(s => ({
        title: s.title,
        snippet: s.snippet.replace(/<[^>]+>/g, ""),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`
      })));
    }
  } catch (e) {
    console.warn("Wiki error:", e.message);
  }
}

testWebSearch("latest news about AI").then(() => {
  console.log("Done");
});
