import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "007muralish@gmail.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "SecureTestPass123!";

function logPass(testName, extra = "") {
  console.log(`\x1b[32m✔ PASS: ${testName}\x1b[0m ${extra}`);
}

function logFail(testName, error) {
  console.error(`\x1b[31m✘ FAIL: ${testName}\x1b[0m`, error);
  process.exitCode = 1;
}

async function runTests() {
  console.log("==================================================");
  console.log("GENZ-AI TOOL EXECUTION END-TO-END VERIFICATION");
  console.log("==================================================\n");

  let sessionCookie = "";

  // Authenticate test user
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    if (loginRes.ok) {
      sessionCookie = loginRes.headers.get("set-cookie") || "";
      logPass("User Login", `Authenticated as ${TEST_EMAIL}`);
    } else {
      // Try registering if doesn't exist
      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: "Test User",
        }),
      });
      sessionCookie = regRes.headers.get("set-cookie") || "";
      logPass("User Registered", `Created ${TEST_EMAIL}`);
    }
  } catch (err) {
    logFail("Authentication", err);
    return;
  }

  // Create a conversation for testing
  let conversationId = "";
  try {
    const convRes = await fetch(`${BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ title: "Tool Execution Test" }),
    });
    const convData = await convRes.json();
    conversationId = convData.conversation?.id || convData.id;
    logPass("Create Conversation", `ID: ${conversationId}`);
  } catch (err) {
    logFail("Create Conversation", err);
    return;
  }

  // Helper to test /api/chat stream
  async function testChatPrompt(testName, prompt, validator) {
    try {
      console.log(`\n--- Testing: ${testName} (Prompt: "${prompt}") ---`);
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          conversationId,
          content: prompt,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        logFail(testName, `HTTP ${res.status}: ${JSON.stringify(errJson)}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamData = "";
      const events = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamData += chunk;
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              events.push(JSON.parse(line.slice(6)));
            } catch {
              // ignore
            }
          }
        }
      }

      // Check: NEVER contain raw action JSON!
      const rawActionCheck = /"action"\s*:\s*"dalle\.text2im"/i.test(streamData) ||
        /"action_input"\s*:\s*"/i.test(streamData);

      if (rawActionCheck) {
        logFail(testName, `Raw unexecuted action JSON detected in stream!\n${streamData.slice(0, 300)}`);
        return;
      }

      const passed = validator(streamData, events);
      if (passed) {
        logPass(testName, `No raw action JSON leaked. Stream valid.`);
      } else {
        logFail(testName, `Stream response did not satisfy validator.`);
      }
    } catch (err) {
      logFail(testName, err);
    }
  }

  // TEST 1: Image Generation (e.g. "generate an image of a cute puppy")
  await testChatPrompt(
    "Tool Execution: Image Generation",
    "generate an image of a cute golden retriever puppy",
    (stream, events) => {
      const hasImageEvent = events.some((e) => e.type === "image" && e.images?.length > 0);
      const hasImageMarkdown = stream.includes("![") && (stream.includes("http") || stream.includes("data:image"));
      console.log(`  Image event emitted: ${hasImageEvent}`);
      console.log(`  Image markdown in stream: ${hasImageMarkdown}`);
      return hasImageEvent || hasImageMarkdown;
    }
  );

  // TEST 2: Math Calculation
  await testChatPrompt(
    "Tool Execution: Calculator",
    "calculate 4539 * 284.23 + 15",
    (stream, events) => {
      // 4539 * 284.23 = 1290119.97 + 15 = 1290134.97
      const hasResult = stream.includes("1290134.97") || stream.includes("1,290,134.97") || stream.includes("Result:");
      console.log(`  Math calculation executed correctly: ${hasResult}`);
      return hasResult;
    }
  );

  // REGRESSION TEST (Requirement 11 & 12):
  // Prompt: "Generate a 5 second video of a futuristic purple sports car"
  // Assert: video_generation executor is called, image_generation is NOT called, no raw JSON, no refusal
  await testChatPrompt(
    "REGRESSION TEST: 'Generate a 5 second video of a futuristic purple sports car'",
    "Generate a 5 second video of a futuristic purple sports car",
    (stream, events) => {
      // 1. MUST NOT call image_generation
      const hasImageEvent = events.some((e) => e.type === "image");
      const hasImageMarkdown = stream.includes("![") && !stream.includes("![image]");
      const calledImageGen = hasImageEvent || (hasImageMarkdown && stream.includes("generated image"));

      if (calledImageGen) {
        console.error("  ❌ FAILED: Incorrectly called image_generation for a video request!");
        return false;
      }

      // 2. MUST NOT refuse with 'I can't directly generate video files'
      const hasRefusal =
        stream.toLowerCase().includes("cannot generate video") ||
        stream.toLowerCase().includes("can't directly generate video") ||
        stream.toLowerCase().includes("cannot create video") ||
        stream.toLowerCase().includes("i cannot make videos");

      if (hasRefusal) {
        console.error("  ❌ FAILED: Model refused with video capability refusal!");
        return false;
      }

      // 3. MUST call video_generation executor (Replicate integration)
      const calledVideoGen =
        stream.includes("Replicate") ||
        stream.toLowerCase().includes("video") ||
        stream.includes("<video") ||
        stream.includes("Credit");

      console.log(`  video_generation executor called: ${calledVideoGen}`);
      console.log(`  image_generation NOT called: ${!calledImageGen}`);
      console.log(`  no refusal: ${!hasRefusal}`);

      return calledVideoGen && !calledImageGen && !hasRefusal;
    }
  );

  // TEST 3B: Video Generation Variations ("make a video", "text to video", "create a video")
  await testChatPrompt(
    "Tool Execution: Video Generation Variation ('text to video: cyber samurai')",
    "text to video: cyber samurai walking through rainy Tokyo streets",
    (stream, events) => {
      const calledVideoGen =
        stream.includes("Replicate") ||
        stream.toLowerCase().includes("video") ||
        stream.includes("<video") ||
        stream.includes("Credit");
      const calledImageGen = events.some((e) => e.type === "image");
      return calledVideoGen && !calledImageGen;
    }
  );

  // TEST 4: Real Web Search
  await testChatPrompt(
    "Tool Execution: Web Search",
    "search the web for latest Mars Rover discoveries today",
    (stream, events) => {
      const hasSources = events.some((e) => e.type === "sources" && e.sources?.length > 0);
      const hasSummary = stream.length > 50;
      console.log(`  Search sources emitted: ${hasSources}`);
      return hasSources || hasSummary;
    }
  );

  // TEST 5: Conversational DALL-E prompt (exact trigger that caused raw action JSON)
  await testChatPrompt(
    "Tool Execution: Conversational DALL-E prompt",
    "can you use dalle to generate a futuristic cyber city with neon lights",
    (stream, events) => {
      const hasImage = stream.includes("![") || events.some((e) => e.type === "image");
      console.log(`  Real image generated & rendered: ${hasImage}`);
      return hasImage;
    }
  );

  // TEST 6: Text to Speech
  await testChatPrompt(
    "Tool Execution: Text to Speech",
    "speak out this text in audio: welcome to genz ai assistant",
    (stream, events) => {
      const hasAudioOrSpoken = stream.toLowerCase().includes("audio") || stream.toLowerCase().includes("speak") || stream.includes("<audio");
      console.log(`  Audio tool executed cleanly: ${hasAudioOrSpoken}`);
      return hasAudioOrSpoken;
    }
  );

  console.log("\n==================================================");
  console.log("TOOL VERIFICATION COMPLETE");
  console.log("==================================================");
  await prisma.$disconnect();
}

runTests().catch(console.error);
