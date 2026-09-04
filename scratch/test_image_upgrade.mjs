import { PrismaClient } from "@prisma/client";
import { detectImageIntent, searchImages, generateAiImage } from "../src/lib/ai/image.js";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== 1. Testing Intent Detection ===");
  const testCases = [
    { input: "hello", expectedMode: "none" },
    { input: "explain quantum computing", expectedMode: "none" },
    { input: "actor surya photo", expectedMode: "search", expectedPrompt: "actor surya" },
    { input: "actor surya photo snd panu", expectedMode: "search", expectedPrompt: "actor surya" },
    { input: "send me a photo of a tiger", expectedMode: "search", expectedPrompt: "tiger" },
    { input: "show me a Ferrari", expectedMode: "search", expectedPrompt: "Ferrari" },
    { input: "generate an image of a futuristic city", expectedMode: "generate", expectedPrompt: "futuristic city" },
    { input: "create a picture of a cat", expectedMode: "generate", expectedPrompt: "cat" },
    { input: "generate a futuristic city", expectedMode: "generate", expectedPrompt: "futuristic city" },
    { input: "show me how to make coffee", expectedMode: "none" },
    { input: "show me an example of recursion", expectedMode: "none" },
  ];

  let passedIntent = true;
  for (const tc of testCases) {
    const res = detectImageIntent(tc.input);
    const matchMode = res.mode === tc.expectedMode;
    const matchPrompt = !tc.expectedPrompt || res.prompt.toLowerCase() === tc.expectedPrompt.toLowerCase();
    if (matchMode && matchPrompt) {
      console.log(`  ✔ "${tc.input}" => mode: ${res.mode}, prompt: "${res.prompt}"`);
    } else {
      console.error(`  ✘ FAILED: "${tc.input}" => got ${JSON.stringify(res)}, expected mode: ${tc.expectedMode}`);
      passedIntent = false;
    }
  }

  console.log("\n=== 2. Testing Photo Search Fallbacks (Zero API Keys) ===");
  const searchQueries = ["actor surya", "tiger", "Ferrari"];
  let passedSearch = true;
  for (const q of searchQueries) {
    const results = await searchImages(q);
    if (results.length > 0 && results[0].url.startsWith("http")) {
      const top = results[0];
      const hasUrl = Boolean(top.url);
      const hasTitle = Boolean(top.title);
      const hasSource = Boolean(top.source);
      const hasThumb = Boolean(top.thumbnail);
      console.log(`  ✔ "${q}" => found ${results.length} photos.`);
      console.log(`     URL: ${top.url.slice(0, 60)}...`);
      console.log(`     Thumbnail: ${top.thumbnail ? top.thumbnail.slice(0, 60) + '...' : 'none'}`);
      console.log(`     Title: ${top.title}`);
      console.log(`     Source: ${top.source}`);
      console.log(`     Author: ${top.author || 'N/A'}`);
      if (!hasUrl || !hasTitle || !hasSource || !hasThumb) {
        console.error(`     ✘ FAILED structured data validation for "${q}"`);
        passedSearch = false;
      }
    } else {
      console.error(`  ✘ FAILED: "${q}" returned no images.`);
      passedSearch = false;
    }
  }

  console.log("\n=== 3. Testing AI Image Generation ===");
  let passedGen = true;
  try {
    const genResult = await generateAiImage("futuristic city");
    if (genResult && genResult.url && (genResult.url.startsWith("data:image/") || genResult.url.startsWith("https://"))) {
      console.log(`  ✔ Generated image for "futuristic city" via ${genResult.source}. Size: ${genResult.size} bytes`);
    } else {
      console.error("  ✘ FAILED: generateAiImage did not return a valid url");
      passedGen = false;
    }
  } catch (err) {
    console.error("  ✘ FAILED generation:", err.message);
    passedGen = false;
  }

  console.log("\n=== 4. Testing Persistence & Conversation Retrieval ===");
  let passedPersistence = true;
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("  Skipping DB test: no user found");
    } else {
      const conv = await prisma.conversation.create({
        data: {
          title: "Surya Photo Test",
          userId: user.id,
          model: "genz-search",
        },
      });

      // Simulate assistant message with Suriya photo attachment
      const suryaSearch = await searchImages("actor surya");
      const suryaImg = suryaSearch[0];

      await prisma.message.create({
        data: {
          conversationId: conv.id,
          role: "assistant",
          content: `Here is a photo of **actor surya**:\n\n![${suryaImg.alt || suryaImg.title}](${suryaImg.url})\n\n`,
          model: "genz-search",
          tokensUsed: 100,
          attachments: {
            create: [
              {
                filename: `${suryaImg.title}.jpg`,
                mimeType: "image/jpeg",
                size: 150000,
                url: suryaImg.url,
              },
            ],
          },
        },
        include: { attachments: true },
      });

      // Verify retrieval logic as in GET /api/conversations/[id]
      const fetched = await prisma.conversation.findUnique({
        where: { id: conv.id },
        include: { messages: { include: { attachments: true } } },
      });

      const mappedMessages = fetched.messages.map((m) => {
        const imageAttachments = m.attachments?.filter((att) =>
          att.mimeType?.startsWith("image/")
        );
        const images =
          imageAttachments && imageAttachments.length > 0
            ? imageAttachments.map((att) => {
                const cleanName = att.filename.replace(/\.[a-zA-Z0-9]+$/, "").replace(/_/g, " ");
                return {
                  url: att.url,
                  thumbnail: att.url,
                  title: cleanName,
                  alt: cleanName,
                  source: m.model === "genz-search" ? "Photo Search" : "AI Generated",
                  author: m.model === "genz-search" ? "Wikimedia Commons" : "Pollinations AI",
                };
              })
            : undefined;

        return {
          ...m,
          type: images && images.length > 0 ? "image" : "text",
          images,
        };
      });

      const assistantMsg = mappedMessages[0];
      if (
        assistantMsg &&
        assistantMsg.type === "image" &&
        assistantMsg.images &&
        assistantMsg.images.length > 0 &&
        assistantMsg.images[0].url === suryaImg.url &&
        assistantMsg.images[0].title
      ) {
        console.log(`  ✔ Successfully saved and retrieved conversation with structured image: ${assistantMsg.images[0].url.slice(0, 60)}...`);
        console.log(`     Title: ${assistantMsg.images[0].title}, Source: ${assistantMsg.images[0].source}`);
      } else {
        console.error("  ✘ FAILED: mapped message did not have structured image");
        passedPersistence = false;
      }

      // Cleanup
      await prisma.conversation.delete({ where: { id: conv.id } });
    }
  } catch (dbErr) {
    console.error("  ✘ DB test error:", dbErr.message);
    passedPersistence = false;
  }

  await prisma.$disconnect();

  if (passedIntent && passedSearch && passedGen && passedPersistence) {
    console.log("\n==========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================");
    process.exit(0);
  } else {
    console.error("\n❌ SOME TESTS FAILED!");
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
