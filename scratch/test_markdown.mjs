import React from "react";
import { renderToString } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Test different markdown snippets
const cases = [
  { name: "A. Plain text", md: "Hello world." },
  { name: "B. Standalone image", md: "![C. Joseph](https://example.com/image.jpg)" },
  { name: "C. Text and standalone image", md: "Here is an image:\n\n![C. Joseph](https://example.com/image.jpg)" },
  { name: "D. Text before and after", md: "Text before ![image](https://example.com/img.png) and text after." },
  { name: "E. Multiple images", md: "![image1](https://example.com/1.png)\n\n![image2](https://example.com/2.png)" },
  { name: "F. Consecutive images", md: "![image1](https://example.com/1.png) ![image2](https://example.com/2.png)" }
];

function ImageCard({ url, alt }) {
  return React.createElement("div", { className: "image-card" }, alt + ": " + url);
}

function CustomP({ node, children, ...props }) {
  // Check if any child in node.children is an img
  const hasImage = node?.children?.some(
    (child) => child.type === "element" && child.tagName === "img"
  );

  if (hasImage) {
    return React.createElement("div", { className: "my-2", ...props }, children);
  }
  return React.createElement("p", props, children);
}

for (const c of cases) {
  const html = renderToString(
    React.createElement(
      ReactMarkdown,
      {
        remarkPlugins: [remarkGfm],
        components: {
          p: CustomP,
          img: ({ src, alt }) => React.createElement(ImageCard, { url: src, alt: alt })
        }
      },
      c.md
    )
  );
  console.log(`\n=== ${c.name} ===\nMD: ${c.md}\nHTML:\n${html}`);
  if (html.includes("<p>") && html.includes("<div class=\"image-card\">")) {
    // Check if div is inside p
    const match = /<p>[\s\S]*?<div[\s\S]*?<\/p>/.test(html);
    if (match) {
      console.error("FAIL: <div> inside <p> detected!");
    } else {
      console.log("PASS: Valid nesting.");
    }
  } else {
    console.log("PASS: No invalid nesting.");
  }
}
