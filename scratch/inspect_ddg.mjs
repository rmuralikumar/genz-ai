import fs from "fs";

async function inspectDDGLite() {
  const query = "latest AI news";
  const res = await fetch("https://lite.duckduckgo.com/lite/", {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "q=" + encodeURIComponent(query),
  });
  const html = await res.text();
  fs.writeFileSync("scratch/ddg_lite.html", html);
  console.log("Saved ddg_lite.html");

  // Let's parse links
  const links = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*result-link[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log("Result link count:", links.length);
  for (const l of links.slice(0, 3)) {
    console.log("URL:", l[1], "Title:", l[2].replace(/<[^>]+>/g, "").trim());
  }

  // Also test DDG HTML
  const resHtml = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  const html2 = await resHtml.text();
  fs.writeFileSync("scratch/ddg_html.html", html2);
  const titles = [...html2.matchAll(/<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const snippets = [...html2.matchAll(/<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const linksFull = [...html2.matchAll(/<a class="result__title"[^>]*>([\s\S]*?)<\/a>/gi)];
  console.log("DDG HTML results:", snippets.length, "titles:", titles.length, "linksFull:", linksFull.length);
  for (const s of snippets.slice(0, 3)) {
    console.log("Snippet URL:", s[1], "Snippet Text:", s[2].replace(/<[^>]+>/g, "").trim());
  }
}

inspectDDGLite();
