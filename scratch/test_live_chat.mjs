import { prisma } from "../src/lib/db/prisma.js";

async function testLiveChatFlow() {
  console.log("=== Testing Live Chat API Flow ===");

  // 1. Find or create a test user & conversation
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test_murali@genz.ai",
        passwordHash: "test_hash_123",
        name: "Test User",
      }
    });
  }

  const conv = await prisma.conversation.create({
    data: {
      title: "Test Multimodal Conversation",
      userId: user.id,
      model: "genz-fast",
    }
  });

  console.log("Created test conversation:", conv.id);

  // 2. Helper to simulate POST /api/chat
  async function callChat(content, attachments = [], model = "genz-fast") {
    // Call chat route directly via fetch to localhost:3000
    // First, let's login or set cookie if needed, or pass auth header
    // In our app, getCurrentUser reads the session token from cookie
    // Let's create a session token using jose as done in src/lib/auth/jwt.ts
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "genz-ai-jwt-session-secret-change-in-production-secure-32-chars");
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `genz_session=${token}`,
      },
      body: JSON.stringify({
        conversationId: conv.id,
        content,
        model,
        attachments,
      })
    });

    console.log(`Query: "${content}" -> Status:`, res.status);
    const text = await res.text();
    console.log("SSE Stream snippet:", text.slice(0, 300).replace(/\n/g, " "));
    return { status: res.status, body: text };
  }

  // Test 1: Image search
  console.log("\n--- Testing Live Photo Search ---");
  await callChat("actor surya photo snd panu");

  // Test 2: Image generation
  console.log("\n--- Testing Live AI Image Generation ---");
  await callChat("generate a futuristic city");

  // Test 3: Web Search
  console.log("\n--- Testing Live Web Search ---");
  await callChat("latest AI news today");

  // Verify messages in DB
  const msgs = await prisma.message.findMany({
    where: { conversationId: conv.id },
    include: { attachments: true }
  });

  console.log(`\nPersisted messages in conversation: ${msgs.length}`);
  for (const m of msgs) {
    console.log(`- [${m.role}] (${m.model}): ${m.content.slice(0, 60)}... [Attachments: ${m.attachments.length}]`);
  }

  await prisma.$disconnect();
  console.log("\n✔ LIVE CHAT VERIFICATION COMPLETED!");
}

testLiveChatFlow().catch(console.error);
