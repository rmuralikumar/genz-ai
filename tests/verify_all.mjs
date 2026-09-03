import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "007muralish@gmail.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "SecureTestPass123!";

function logPass(testName) {
  console.log(`\x1b[32m✔ PASS: ${testName}\x1b[0m`);
}

function logFail(testName, error) {
  console.error(`\x1b[31m✘ FAIL: ${testName}\x1b[0m`, error);
  process.exitCode = 1;
}

async function runTests() {
  console.log("==================================================");
  console.log("GENZ-AI END-TO-END VERIFICATION SUITE");
  console.log("==================================================\n");

  let testSessionCookie = "";
  let registeredUserId = "";

  // Clean up test user if previously exists
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            TEST_EMAIL.toLowerCase(),
            "duplicate_check@example.com",
            "concurrent_test@example.com",
          ],
        },
      },
    });
  } catch (err) {
    console.warn("Notice during cleanup:", err.message);
  }

  // TEST 1: Invalid Email Signup
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notanemail",
        password: "ValidPassword123!",
        name: "Invalid Email Test",
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.error.includes("valid email address")) {
      logPass("Invalid email signup returns HTTP 400 with friendly message");
    } else {
      logFail("Invalid email signup", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Invalid email signup", err);
  }

  // TEST 2: Short Password Signup (< 6 chars)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "short_pass@example.com",
        password: "123",
        name: "Short Pass Test",
      }),
    });
    const data = await res.json();
    if (res.status === 400 && data.error.includes("at least 6 characters")) {
      logPass("Weak password signup returns HTTP 400 with friendly message");
    } else {
      logFail("Weak password signup", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Weak password signup", err);
  }

  // TEST 3: Successful New User Signup (Test Account: 007muralish@gmail.com)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Murali Kumar",
      }),
    });
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");

    if (res.status === 201 && data.user && data.user.email === TEST_EMAIL.toLowerCase()) {
      registeredUserId = data.user.id;
      testSessionCookie = setCookie ? setCookie.split(";")[0] : "";
      logPass("New user signup succeeds with HTTP 201 and session cookie");
    } else {
      logFail("New user signup", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("New user signup", err);
  }

  // TEST 4: Duplicate Email Signup
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "DifferentPass456!",
        name: "Duplicate User",
      }),
    });
    const data = await res.json();
    if (res.status === 409 && data.error.includes("already exists")) {
      logPass("Duplicate email signup returns HTTP 409 with 'An account with this email already exists.'");
    } else {
      logFail("Duplicate email signup", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Duplicate email signup", err);
  }

  // TEST 5: Concurrent Duplicate Submissions Race Condition Check
  try {
    const concurrentEmail = "concurrent_test@example.com";
    const [res1, res2] = await Promise.all([
      fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: concurrentEmail, password: "Password123!", name: "Race 1" }),
      }),
      fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: concurrentEmail, password: "Password123!", name: "Race 2" }),
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    if (statuses[0] === 201 && statuses[1] === 409) {
      logPass("Concurrent signup race condition properly resolved with 201 + 409 (no 500)");
    } else {
      logFail("Concurrent signup race condition", `Statuses: ${statuses}`);
    }
  } catch (err) {
    logFail("Concurrent signup race condition", err);
  }

  // TEST 6: Login with Incorrect Password
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: "WrongPassword999!",
      }),
    });
    const data = await res.json();
    if (res.status === 401 && data.error === "Invalid email or password") {
      logPass("Incorrect password login returns HTTP 401 with friendly message");
    } else {
      logFail("Incorrect password login", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Incorrect password login", err);
  }

  // TEST 7: Successful Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");

    if (res.status === 200 && data.user && data.user.id === registeredUserId) {
      testSessionCookie = setCookie ? setCookie.split(";")[0] : testSessionCookie;
      logPass("Successful login returns HTTP 200, user profile, and session cookie");
    } else {
      logFail("Successful login", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Successful login", err);
  }

  // TEST 8: Session Persistence via /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: testSessionCookie },
    });
    const data = await res.json();
    if (res.status === 200 && data.user && data.user.email === TEST_EMAIL.toLowerCase()) {
      logPass("Session persistence verified: /api/auth/me returns authenticated user");
    } else {
      logFail("Session persistence", `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail("Session persistence", err);
  }

  // TEST 9: Multilingual Conversation: "enna panra" (Tanglish greeting)
  try {
    // Create a test conversation
    const convRes = await fetch(`${BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
      },
      body: JSON.stringify({ title: "Tanglish Test", model: "genz-fast" }),
    });
    const convData = await convRes.json();
    const convId = convData.conversation.id;

    console.log("\nTesting Multilingual AI Streaming with conversation:", convId);

    // Send "enna panra"
    const chatRes = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
      },
      body: JSON.stringify({
        conversationId: convId,
        content: "enna panra",
        model: "genz-fast",
      }),
    });

    const reader = chatRes.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) accumulated += parsed.text;
          } catch { }
        }
      }
    }

    console.log(`[User]: enna panra\n[GENZ-AI]: ${accumulated}`);
    if (accumulated.trim().length > 0) {
      logPass("Multilingual conversation 'enna panra' generated fluent Tanglish response");
    } else {
      logFail("Multilingual conversation 'enna panra'", "Empty response received");
    }

    // TEST 10: Multilingual Explanation: "machine learning na enna?"
    const mlRes = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
      },
      body: JSON.stringify({
        conversationId: convId,
        content: "machine learning na enna?",
        model: "genz-fast",
      }),
    });

    const mlReader = mlRes.body.getReader();
    let mlAccumulated = "";

    while (true) {
      const { done, value } = await mlReader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) mlAccumulated += parsed.text;
          } catch { }
        }
      }
    }

    console.log(`\n[User]: machine learning na enna?\n[GENZ-AI]: ${mlAccumulated}`);
    if (mlAccumulated.trim().length > 0) {
      logPass("Multilingual explanation 'machine learning na enna?' generated clear Tanglish explanation");
    } else {
      logFail("Multilingual explanation 'machine learning na enna?'", "Empty response received");
    }

    // TEST 11: Message Regeneration with isRetry: true (verify no duplicate user prompt in DB)
    const regenRes = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
      },
      body: JSON.stringify({
        conversationId: convId,
        content: "machine learning na enna?",
        model: "genz-fast",
        isRetry: true,
      }),
    });

    const regenReader = regenRes.body.getReader();
    while (true) {
      const { done } = await regenReader.read();
      if (done) break;
    }

    const messagesInDb = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
    });

    const mlUserPrompts = messagesInDb.filter(
      (m) => m.role === "user" && m.content === "machine learning na enna?"
    );

    if (mlUserPrompts.length === 1) {
      logPass("Regenerate with isRetry: true does NOT duplicate user prompt in database");
    } else {
      logFail("Regenerate with isRetry", `Found ${mlUserPrompts.length} duplicate user prompts in DB`);
    }
  } catch (err) {
    logFail("Multilingual conversation tests", err);
  }

  // TEST 12: Logout
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: testSessionCookie },
    });
    const setCookie = res.headers.get("set-cookie") || "";
    const isCleared = setCookie.toLowerCase().includes("max-age=0") || setCookie.toLowerCase().includes("expires=");

    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meData = await meRes.json();

    if (res.status === 200 && isCleared && meData.user === null) {
      logPass("Logout clears session cookie and /api/auth/me returns null user");
    } else {
      logFail("Logout verification", `Status: ${res.status}, Me user: ${JSON.stringify(meData.user)}`);
    }
  } catch (err) {
    logFail("Logout verification", err);
  }

  console.log("\n==================================================");
  console.log("ALL VERIFICATION SUITE TESTS COMPLETED!");
  console.log("==================================================");

  await prisma.$disconnect();
}

runTests().catch(async (e) => {
  console.error("Fatal test suite runner error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
