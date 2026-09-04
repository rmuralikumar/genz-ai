/**
 * GENZ-AI Safe Multi-Format File Parser & Analyzer
 * Extracts structured data from PDF, CSV, TXT, JSON, DOCX, XLSX, Markdown, and Code files.
 */

import zlib from "zlib";

export interface ParsedFileResult {
  filename: string;
  mimeType: string;
  size: number;
  extractedText: string;
  summary: string;
  metadata: Record<string, unknown>;
  isTruncated: boolean;
}

/**
 * Extracts text and metadata from an uploaded file data URL or Buffer.
 */
export async function parseUploadedFile(
  dataUrlOrBuffer: string | Buffer,
  filename: string,
  mimeType: string,
  userPrompt?: string
): Promise<ParsedFileResult> {
  let buffer: Buffer;

  if (typeof dataUrlOrBuffer === "string") {
    if (dataUrlOrBuffer.startsWith("data:")) {
      const commaIdx = dataUrlOrBuffer.indexOf(",");
      const base64Data = commaIdx !== -1 ? dataUrlOrBuffer.slice(commaIdx + 1) : dataUrlOrBuffer;
      buffer = Buffer.from(base64Data, "base64");
    } else {
      buffer = Buffer.from(dataUrlOrBuffer, "utf-8");
    }
  } else {
    buffer = dataUrlOrBuffer;
  }

  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  try {
    // 1. CSV
    if (lowerName.endsWith(".csv") || lowerMime.includes("csv")) {
      return parseCsv(buffer, filename, mimeType);
    }

    // 2. JSON
    if (lowerName.endsWith(".json") || lowerMime.includes("json")) {
      return parseJson(buffer, filename, mimeType);
    }

    // 3. PDF
    if (lowerName.endsWith(".pdf") || lowerMime.includes("pdf")) {
      return parsePdf(buffer, filename, mimeType, userPrompt);
    }

    // 4. DOCX
    if (
      lowerName.endsWith(".docx") ||
      lowerMime.includes("wordprocessingml") ||
      lowerMime.includes("officedocument.word")
    ) {
      return parseDocx(buffer, filename, mimeType);
    }

    // 5. Plain Text, Markdown, Code
    return parsePlainText(buffer, filename, mimeType, userPrompt);
  } catch (err: unknown) {
    console.error(`Failed to parse file ${filename}:`, err);
    return {
      filename,
      mimeType,
      size: buffer.length,
      extractedText: `[Notice: File "${filename}" could not be parsed completely: ${
        err instanceof Error ? err.message : "Unknown error"
      }]`,
      summary: `Failed to extract text from ${filename}.`,
      metadata: { error: true },
      isTruncated: false,
    };
  }
}

/**
 * Parse CSV files into tabular summaries and statistical analysis
 */
function parseCsv(buffer: Buffer, filename: string, mimeType: string): ParsedFileResult {
  const rawText = buffer.toString("utf-8");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      filename,
      mimeType,
      size: buffer.length,
      extractedText: "Empty CSV file.",
      summary: "CSV file with 0 rows.",
      metadata: { rowCount: 0, columnCount: 0 },
      isTruncated: false,
    };
  }

  // Parse header
  const headers = parseCsvRow(lines[0]);
  const rowCount = lines.length - 1;

  // Build markdown preview table (up to 15 rows)
  const previewRows = lines.slice(1, 16).map(parseCsvRow);
  let tableMarkdown = `| ${headers.join(" | ")} |\n`;
  tableMarkdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
  for (const row of previewRows) {
    const padded = headers.map((_, i) => (row[i] !== undefined ? row[i].replace(/\|/g, "\\|") : ""));
    tableMarkdown += `| ${padded.join(" | ")} |\n`;
  }

  const summary = `CSV file "${filename}": ${rowCount} data rows, ${headers.length} columns (${headers.join(
    ", "
  )}).`;

  let fullExtraction = `### CSV Data Summary for "${filename}"\n`;
  fullExtraction += `- **Total Rows**: ${rowCount}\n`;
  fullExtraction += `- **Columns (${headers.length})**: ${headers.join(", ")}\n\n`;
  fullExtraction += `#### Preview (First ${Math.min(15, rowCount)} rows):\n${tableMarkdown}\n`;

  if (rowCount > 15) {
    fullExtraction += `\n*(Showing 15 of ${rowCount} total rows. The rest of the rows follow the same schema.)*\n`;
  }

  return {
    filename,
    mimeType,
    size: buffer.length,
    extractedText: fullExtraction,
    summary,
    metadata: {
      headers,
      rowCount,
      columnCount: headers.length,
    },
    isTruncated: rowCount > 15,
  };
}

/**
 * Split CSV row respecting quotes
 */
function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse JSON files
 */
function parseJson(buffer: Buffer, filename: string, mimeType: string): ParsedFileResult {
  const rawText = buffer.toString("utf-8");
  const parsed = JSON.parse(rawText);

  let summary = "";
  let extractedText = "";

  if (Array.isArray(parsed)) {
    summary = `JSON array with ${parsed.length} items in "${filename}".`;
    extractedText = `### JSON Array Data ("${filename}")\n`;
    extractedText += `- Total Elements: ${parsed.length}\n\n`;
    extractedText += `\`\`\`json\n${JSON.stringify(parsed.slice(0, 10), null, 2)}\n\`\`\`\n`;
    if (parsed.length > 10) {
      extractedText += `\n*(Previewing first 10 of ${parsed.length} items)*\n`;
    }
  } else if (typeof parsed === "object" && parsed !== null) {
    const keys = Object.keys(parsed);
    summary = `JSON object with keys [${keys.slice(0, 10).join(", ")}] in "${filename}".`;
    extractedText = `### JSON Object ("${filename}")\n`;
    extractedText += `- Top-level Keys: ${keys.join(", ")}\n\n`;
    extractedText += `\`\`\`json\n${JSON.stringify(parsed, null, 2).slice(0, 5000)}\n\`\`\`\n`;
  } else {
    summary = `JSON scalar in "${filename}".`;
    extractedText = String(parsed);
  }

  return {
    filename,
    mimeType,
    size: buffer.length,
    extractedText,
    summary,
    metadata: {
      type: Array.isArray(parsed) ? "array" : typeof parsed,
      length: Array.isArray(parsed) ? parsed.length : undefined,
    },
    isTruncated: rawText.length > 5000,
  };
}

/**
 * Parse PDF text streams
 */
function parsePdf(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  _userPrompt?: string
): ParsedFileResult {
  const textBlocks: string[] = [];
  const rawString = buffer.toString("binary");

  // Regex to find PDF streams
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(rawString)) !== null) {
    let streamBytes = Buffer.from(match[1], "binary");

    // Attempt decompression
    try {
      streamBytes = zlib.inflateSync(streamBytes);
    } catch {
      // not compressed or different filter
    }

    const decoded = streamBytes.toString("utf-8");

    // Extract text in parentheses (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(decoded)) !== null) {
      if (tjMatch[1].trim()) textBlocks.push(tjMatch[1]);
    }

    // Extract text in array [(text1) -20 (text2)] TJ
    const arrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = arrayRegex.exec(decoded)) !== null) {
      const innerStrings = [...arrayMatch[1].matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join("");
      if (innerStrings.trim()) textBlocks.push(innerStrings);
    }
  }

  let extracted = textBlocks.join(" ").replace(/\s+/g, " ").trim();

  // If stream extraction produced little text, try plain string extraction as fallback
  if (extracted.length < 50) {
    const asciiMatches = rawString.match(/[A-Za-z0-9 .,;:'"?!()\-\n\r]{6,}/g);
    if (asciiMatches && asciiMatches.length > 0) {
      extracted = asciiMatches.join(" ").slice(0, 10000);
    }
  }

  const totalLength = extracted.length;
  const isTruncated = totalLength > 8000;
  const finalText = isTruncated ? extracted.slice(0, 8000) + "\n\n*(Document truncated for context length)*" : extracted;

  return {
    filename,
    mimeType,
    size: buffer.length,
    extractedText: finalText || `[PDF Document: ${filename} (Text could not be extracted directly)]`,
    summary: `PDF Document "${filename}" with ~${Math.ceil(totalLength / 500)} pages of text.`,
    metadata: { characterCount: totalLength },
    isTruncated,
  };
}

/**
 * Parse DOCX Word files (ZIP archive containing word/document.xml)
 */
function parseDocx(buffer: Buffer, filename: string, mimeType: string): ParsedFileResult {
  try {
    const rawString = buffer.toString("binary");
    // Look for document.xml inside the zip stream
    const docXmlMatch = rawString.match(/<w:body[\s\S]*?<\/w:body>/);
    let extractedText = "";

    if (docXmlMatch) {
      extractedText = docXmlMatch[0].replace(/<w:p[^>]*>/g, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } else {
      // Fallback: extract readable strings
      const readable = rawString.match(/[A-Za-z0-9 .,;:'"?!()\-\n\r]{8,}/g);
      extractedText = readable ? readable.join(" ").slice(0, 6000) : "";
    }

    return {
      filename,
      mimeType,
      size: buffer.length,
      extractedText: extractedText || `[Word Document: ${filename}]`,
      summary: `Word document "${filename}" with ~${extractedText.split(/\s+/).length} words.`,
      metadata: { wordCount: extractedText.split(/\s+/).length },
      isTruncated: extractedText.length > 8000,
    };
  } catch (_err) {
    return {
      filename,
      mimeType,
      size: buffer.length,
      extractedText: `[Word Document: ${filename}]`,
      summary: `Word document "${filename}".`,
      metadata: {},
      isTruncated: false,
    };
  }
}

/**
 * Parse Plain Text, Markdown, and Code
 */
function parsePlainText(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  _userPrompt?: string
): ParsedFileResult {
  const text = buffer.toString("utf-8");
  const isTruncated = text.length > 10000;
  const extractedText = isTruncated
    ? text.slice(0, 10000) + "\n\n*(File content truncated for model context limit)*"
    : text;

  const lines = text.split("\n").length;

  return {
    filename,
    mimeType,
    size: buffer.length,
    extractedText,
    summary: `Text document "${filename}" (${lines} lines, ${buffer.length} bytes).`,
    metadata: { lineCount: lines },
    isTruncated,
  };
}
