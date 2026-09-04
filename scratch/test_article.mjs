async function testArticleRead() {
  const url = "https://www.reuters.com/technology/artificial-intelligence/";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });
    console.log("Article fetch status:", res.status);
    const html = await res.text();
    // extract paragraphs
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(p => p.length > 50)
      .slice(0, 5);
    console.log("Extracted paragraphs:", paragraphs.length);
    if (paragraphs.length > 0) {
      console.log("P1:", paragraphs[0].slice(0, 100));
    }
  } catch (e) {
    console.log("Article read error:", e.message);
  }
}
testArticleRead();
