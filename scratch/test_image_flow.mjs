import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("1. Provisioning test user session...");
  const email = `img_test_${Date.now()}@genz.ai`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "TestPassword123!",
      name: "Image Tester",
    }),
  });

  const regCookie = regRes.headers.get("set-cookie") || "";
  const cookie = regCookie.split(";")[0];
  console.log("   Registered test user with cookie:", cookie ? "OK" : "FAILED");

  console.log("2. Creating conversation...");
  const convRes = await fetch(`${BASE_URL}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ title: "Image Test Chat", model: "genz-creative" }),
  });
  const convData = await convRes.json();
  const convId = convData.conversation.id;
  console.log("   Conversation created:", convId);

  console.log("3. Sending image request: 'send me vijay img'...");
  const chatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      conversationId: convId,
      content: "send me vijay img",
      model: "genz-creative",
    }),
  });

  console.log("   Chat response status:", chatRes.status);
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

  console.log("   Streamed output length:", accumulated.length);
  const hasMarkdownImg = accumulated.includes("![") && accumulated.includes("](");
  console.log("   Contains markdown image tag:", hasMarkdownImg);

  console.log("4. Verifying message & attachment in Prisma database...");
  const dbMessages = await prisma.message.findMany({
    where: { conversationId: convId },
    include: { attachments: true },
    orderBy: { createdAt: "asc" },
  });

  console.log("   Total messages in DB:", dbMessages.length);
  const assistantMsg = dbMessages.find((m) => m.role === "assistant");
  console.log("   Assistant message found:", !!assistantMsg);
  console.log("   Assistant attachments count:", assistantMsg?.attachments?.length || 0);

  if (hasMarkdownImg && assistantMsg?.attachments?.length > 0) {
    console.log("\n✔ SUCCESS: Image generation, streaming, rendering, and persistence all passed!");
  } else {
    console.error("\n✘ FAILURE: Image generation test did not meet all criteria.");
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
