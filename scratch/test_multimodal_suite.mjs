import { resolveIntent } from "../src/lib/ai/intent_router.js";
import { performWebSearch } from "../src/lib/ai/web_search.js";
import { searchImages } from "../src/lib/ai/image.js";
import { parseUploadedFile } from "../src/lib/ai/file_parser.js";
import { executeDeepResearch } from "../src/lib/ai/deep_research.js";

async function runMultimodalTests() {
  console.log("==================================================");
  console.log("GENZ-AI MULTIMODAL CAPABILITIES VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, detail = "") {
    if (condition) {
      console.log(`\x1b[32m✔ PASS: ${name}\x1b[0m`);
      passed++;
    } else {
      console.error(`\x1b[31m✘ FAIL: ${name}\x1b[0m`, detail);
      failed++;
    }
  }

  // 1. Intent Router Tests
  console.log("\n--- TEST SUITE 1: INTENT ROUTER ---");
  const imgSearchIntent = resolveIntent({ content: "actor surya photo snd panu" });
  assert("Detects Tamil/English image search request", imgSearchIntent.intent === "IMAGE_SEARCH");
  assert("Extracts actor name cleanly", imgSearchIntent.imageIntent?.prompt.toLowerCase().includes("surya"));

  const imgGenIntent = resolveIntent({ content: "create a cute 3d render of an astronaut cat" });
  assert("Detects image generation request", imgGenIntent.intent === "IMAGE_GENERATION");

  const webSearchIntent = resolveIntent({ content: "what is the latest news about SpaceX launch today?" });
  assert("Detects web search intent for latest news", webSearchIntent.intent === "WEB_SEARCH");

  const deepResearchIntent = resolveIntent({
    content: "explain quantum entanglement and its cryptographic applications",
    modelId: "genz-reasoning"
  });
  assert("Detects deep research when genz-reasoning model is selected", deepResearchIntent.intent === "DEEP_RESEARCH");

  const fileAnalysisIntent = resolveIntent({
    content: "summarize this data",
    attachments: [{ filename: "report.csv", mimeType: "text/csv", size: 1000, url: "data:text/csv;base64,YWJj" }]
  });
  assert("Detects file analysis when document is attached", fileAnalysisIntent.intent === "FILE_ANALYSIS");

  const visionIntent = resolveIntent({
    content: "what is shown in this picture?",
    attachments: [{ filename: "photo.jpg", mimeType: "image/jpeg", size: 50000, url: "data:image/jpeg;base64,YWJj" }]
  });
  assert("Detects image understanding when image is attached", visionIntent.intent === "IMAGE_UNDERSTANDING");

  // 2. Real Web Search Test
  console.log("\n--- TEST SUITE 2: REAL WEB SEARCH ---");
  try {
    const searchRes = await performWebSearch("Next.js 15 features", 3);
    assert("Web search returns results array", Array.isArray(searchRes.results));
    assert("Web search returns at least 1 result", searchRes.results.length > 0);
    if (searchRes.results.length > 0) {
      const first = searchRes.results[0];
      assert("Result has title and url", Boolean(first.title && first.url));
      assert("Result has valid HTTP/HTTPS URL", first.url.startsWith("http"));
      console.log(`   Sample result: "${first.title}" -> ${first.url}`);
    }
  } catch (err) {
    assert("Web search executes without crash", false, err.message);
  }

  // 3. File Parser Test
  console.log("\n--- TEST SUITE 3: MULTI-FORMAT FILE PARSER ---");
  try {
    // Test CSV parsing
    const csvContent = "Name,Age,Role\nAlice,30,Engineer\nBob,25,Designer\nCharlie,35,Manager";
    const base64Csv = Buffer.from(csvContent).toString("base64");
    const dataUrlCsv = `data:text/csv;base64,${base64Csv}`;
    const parsedCsv = await parseUploadedFile(dataUrlCsv, "team.csv", "text/csv");
    assert("CSV parser extracts summary table", parsedCsv.extractedText.includes("Alice") && parsedCsv.extractedText.includes("Designer"));
    assert("CSV parser detects rows and columns", parsedCsv.extractedText.includes("Columns:") && parsedCsv.extractedText.includes("Total Rows: 3"));

    // Test JSON parsing
    const jsonContent = JSON.stringify({ project: "GENZ-AI", status: "production-ready", version: "2.0" });
    const base64Json = Buffer.from(jsonContent).toString("base64");
    const dataUrlJson = `data:application/json;base64,${base64Json}`;
    const parsedJson = await parseUploadedFile(dataUrlJson, "config.json", "application/json");
    assert("JSON parser formats structure cleanly", parsedJson.extractedText.includes("GENZ-AI") && parsedJson.extractedText.includes("production-ready"));
  } catch (err) {
    assert("File parser executes without crash", false, err.message);
  }

  // 4. Image Search Fallback Test (Wikipedia/Wikimedia)
  console.log("\n--- TEST SUITE 4: IMAGE SEARCH FALLBACK ---");
  try {
    const images = await searchImages("Suriya");
    assert("Image search returns results array", Array.isArray(images));
    assert("Image search returns real images", images.length > 0);
    if (images.length > 0) {
      assert("Image has valid URL", images[0].url.startsWith("http"));
      console.log(`   Found ${images.length} images. First URL: ${images[0].url.slice(0, 70)}...`);
    }
  } catch (err) {
    assert("Image search executes without crash", false, err.message);
  }

  // 5. Deep Research Engine Test
  console.log("\n--- TEST SUITE 5: DEEP RESEARCH ENGINE ---");
  try {
    const progressLog = [];
    const research = await executeDeepResearch("Renewable energy trends in 2025", (step, text) => {
      progressLog.push({ step, text });
    });
    assert("Deep research generates report markdown", Boolean(research.reportMarkdown && research.reportMarkdown.length > 100));
    assert("Deep research reports progress steps", progressLog.length >= 3);
    assert("Deep research collects sources", Array.isArray(research.sources) && research.sources.length > 0);
    console.log(`   Research completed in ${progressLog.length} steps with ${research.sources.length} sources.`);
  } catch (err) {
    assert("Deep research executes without crash", false, err.message);
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runMultimodalTests();
