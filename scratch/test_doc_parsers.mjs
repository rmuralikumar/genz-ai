import zlib from "zlib";

// Test PDF text extraction logic
function extractTextFromPdfBuffer(buffer) {
  const textContent = [];
  const str = buffer.toString("binary");
  
  // Look for text streams
  // Standard text blocks in PDF are between BT and ET
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    let streamData = Buffer.from(match[1], "binary");
    // Try to decompress FlateDecode streams
    try {
      streamData = zlib.inflateSync(streamData);
    } catch {
      // not flate or raw
    }
    const decoded = streamData.toString("utf-8");
    // Extract Tj and TJ text operations
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decoded)) !== null) {
      textContent.push(tjMatch[1]);
    }
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrayMatch;
    while ((arrayMatch = tjArrayRegex.exec(decoded)) !== null) {
      const innerStrings = [...arrayMatch[1].matchAll(/\(([^)]*)\)/g)].map(m => m[1]).join("");
      textContent.push(innerStrings);
    }
  }

  return textContent.join(" ").trim();
}

console.log("PDF parser helper defined.");
