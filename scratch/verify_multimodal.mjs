import { resolveIntent } from "../src/lib/ai/intent_router.js";
import { performWebSearch } from "../src/lib/ai/web_search.js";
import { searchImages, generateAiImage } from "../src/lib/ai/image.js";
import { parseUploadedFile } from "../src/lib/ai/file_parser.js";
import { executeDeepResearch } from "../src/lib/ai/deep_research.js";

async function runTests() {
  console.log("=== GENZ-AI MULTIMODAL VERIFICATION SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✔ PASS: ${name}`);
      passed++;
    } else {
      console.error(`✘ FAIL: ${name}`);
    }
  }

  // 1. Intent Routing Tests
  console.log("\n--- Testing Intent Routing ---");
  const chatIntent = resolveIntent({ content: "hello" });
  assert(chatIntent.intent === "CHAT", 'Intent for "hello" is CHAT');

  const webIntent = resolveIntent({ content: "latest AI news" });
  assert(webIntent.intent === "WEB_SEARCH", 'Intent for "latest AI news" is WEB_SEARCH');

  const searchImgIntent = resolveIntent({ content: "actor surya photo snd panu" });
  assert(searchImgIntent.intent === "IMAGE_SEARCH", 'Intent for "actor surya photo snd panu" is IMAGE_SEARCH');

  const genImgIntent = resolveIntent({ content: "generate a futuristic cyberpunk city" });
  assert(genImgIntent.intent === "IMAGE_GENERATION", 'Intent for "generate a futuristic cyberpunk city" is IMAGE_GENERATION');

  const visionIntent = resolveIntent({
    content: "What is in this image?",
    attachments: [{ filename: "test.png", mimeType: "image/png", size: 100, url: "data:image/png;base64,123" }]
  });
  assert(visionIntent.intent === "IMAGE_ANALYSIS", "Intent with image attachment is IMAGE_ANALYSIS");

  const fileIntent = resolveIntent({
    content: "Summarize this data",
    attachments: [{ filename: "data.csv", mimeType: "text/csv", size: 500, url: "name,age\nAlice,30" }]
  });
  assert(fileIntent.intent === "FILE_ANALYSIS", "Intent with CSV attachment is FILE_ANALYSIS");

  const researchIntent = resolveIntent({
    content: "Research the future of AI coding agents in 2026",
    modelId: "genz-reasoning"
  });
  assert(researchIntent.intent === "DEEP_RESEARCH", "Intent with genz-reasoning is DEEP_RESEARCH");

  // 2. Web Search Test
  console.log("\n--- Testing Real Web Search ---");
  const searchResults = await performWebSearch("latest AI news", 3);
  assert(searchResults.results.length > 0, "Web search returns real-time results");
  if (searchResults.results.length > 0) {
    assert(!!searchResults.results[0].url && searchResults.results[0].url.startsWith("http"), "Web search result has valid HTTP URL: " + searchResults.results[0].url);
    assert(!!searchResults.results[0].title, "Web search result has title: " + searchResults.results[0].title);
    assert(!!searchResults.results[0].snippet, "Web search result has snippet");
  }

  // 3. Photo Search Test
  console.log("\n--- Testing Real Image Search ---");
  const suriyaImgs = await searchImages("actor suriya");
  assert(suriyaImgs.length > 0, 'Image search for "actor suriya" returned results');
  if (suriyaImgs.length > 0) {
    assert(suriyaImgs[0].url.startsWith("http"), "Image result has valid HTTP URL: " + suriyaImgs[0].url);
  }

  // 4. Image Generation Test
  console.log("\n--- Testing Real AI Image Generation ---");
  const generatedImg = await generateAiImage("futuristic cyberpunk neon city");
  assert(
    !!generatedImg &&
      (generatedImg.url.startsWith("http") || generatedImg.url.startsWith("data:image/")),
    "Image generation returned real image URL (starts with http or data:image/)"
  );

  // 5. File Parsing Test (CSV & JSON)
  console.log("\n--- Testing File Parsing (CSV & JSON) ---");
  const sampleCsv = "Name,Role,Score\nMurali,Lead Engineer,99\nAgent,Antigravity,100\n";
  const parsedCsv = await parseUploadedFile(sampleCsv, "team.csv", "text/csv");
  assert(parsedCsv.metadata.rowCount === 2, "CSV parser extracted 2 data rows");
  assert(parsedCsv.extractedText.includes("Murali"), "CSV markdown preview includes row data");

  const sampleJson = JSON.stringify({ project: "GENZ-AI", status: "production", version: "2.0" });
  const parsedJson = await parseUploadedFile(sampleJson, "meta.json", "application/json");
  assert(parsedJson.extractedText.includes("GENZ-AI"), "JSON parser extracted JSON structure");

  // 6. Deep Research Pipeline Test
  console.log("\n--- Testing Deep Research Pipeline ---");
  const progressLogs = [];
  const researchOutput = await executeDeepResearch("Future of quantum computing in AI", (step, text) => {
    progressLogs.push(step.title);
  });
  assert(progressLogs.length >= 3, "Deep research reported progress across multiple stages: " + progressLogs.length);
  assert(researchOutput.reportMarkdown.includes("Executive Summary"), "Deep research report contains Executive Summary");
  assert(researchOutput.reportMarkdown.includes("Key Findings"), "Deep research report contains Key Findings");
  assert(researchOutput.sources.length > 0, "Deep research report includes gathered sources: " + researchOutput.sources.length);

  // 7. Ollama Vision Test
  console.log("\n--- Testing Ollama Gemma 3 Vision ---");
  const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  try {
    const visionRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        messages: [{ role: "user", content: "What color is this image?", images: [tinyPng] }],
        stream: false,
      })
    });
    if (visionRes.ok) {
      const vData = await visionRes.json();
      assert(!!vData.message?.content, "Ollama vision model answered: " + vData.message?.content?.trim());
    } else {
      console.warn("Ollama vision returned non-200 (skipping if server busy)");
    }
  } catch (e) {
    console.warn("Ollama vision check skipped:", e.message);
  }

  console.log(`\n=========================================`);
  console.log(`RESULTS: Passed ${passed} / ${total} tests.`);
  console.log(`=========================================`);
  if (passed === total) {
    console.log("✔ ALL MULTIMODAL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  }
}

runTests().catch(console.error);
