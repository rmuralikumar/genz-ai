// Test Ollama gemma3:4b with an image
async function testOllamaVision() {
  // A tiny 1x1 red PNG base64
  const redPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  console.log("Testing Ollama gemma3:4b vision...");
  try {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:4b",
        messages: [
          {
            role: "user",
            content: "What color is this image? Reply concisely.",
            images: [redPngBase64]
          }
        ],
        stream: false
      })
    });

    console.log("Ollama status:", res.status);
    const data = await res.json();
    console.log("Ollama vision answer:", data.message?.content);
  } catch (err) {
    console.error("Vision error:", err);
  }
}

testOllamaVision();
