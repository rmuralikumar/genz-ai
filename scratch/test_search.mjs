// Test search capabilities
async function testSearch() {
  const query = "latest AI news 2025";
  console.log("Testing search for:", query);

  // 1. DuckDuckGo HTML
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    const html = await res.text();
    console.log("DDG HTML status:", res.status, "length:", html.length);
    const regex = /<a class="result__snippet[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /<a class="result__url[^>]*>([\s\S]*?)<\/a>/g;
  } catch (e) {
    console.log("DDG error:", e.message);
  }

  // 2. DuckDuckGo Lite
  try {
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "q=" + encodeURIComponent(query),
    });
    const html = await res.text();
    console.log("DDG Lite status:", res.status, "length:", html.length);
    // Parse table rows in lite
    const linkMatches = [...html.matchAll(/<a class=['"]result-link['"] href=['"]([^'"]+)['"]>([\s\S]*?)<\/a>/g)];
    const snippetMatches = [...html.matchAll(/<td class=['"]result-snippet['"]>([\s\S]*?)<\/td>/g)];
    console.log("DDG Lite link matches:", linkMatches.length, "snippet matches:", snippetMatches.length);
    if (linkMatches.length > 0) {
      console.log("Sample result 1:", {
        url: linkMatches[0][1],
        title: linkMatches[0][2].replace(/<[^>]+>/g, "").trim(),
        snippet: snippetMatches[0]?.[1]?.replace(/<[^>]+>/g, "").trim()
      });
    }
  } catch (e) {
    console.log("DDG Lite error:", e.message);
  }

  // 3. Wikipedia API for current / encyclopedic events
  try {
    const wikiRes = await fetch("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=" + encodeURIComponent(query) + "&utf8=&format=json");
    const wikiData = await wikiRes.json();
    console.log("Wiki search results:", wikiData.query?.search?.length || 0);
    if (wikiData.query?.search?.length > 0) {
      console.log("Wiki first:", wikiData.query.search[0].title);
    }
  } catch (e) {
    console.log("Wiki error:", e.message);
  }
}

testSearch();
