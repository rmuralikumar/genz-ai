import React from "react";
import { renderToString } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ImageCard({ url, alt }) {
  return React.createElement("div", { className: "image-card" }, alt + ": " + url);
}

function CustomP({ node, children, ...props }) {
  const hasImage = node?.children?.some(
    (child) => child.type === "element" && child.tagName === "img"
  );

  if (hasImage) {
    return React.createElement("div", { className: "my-2", ...props }, children);
  }
  return React.createElement("p", props, children);
}

// Streaming steps
const streamSteps = [
  "Here is",
  "Here is an image:\n\n",
  "Here is an image:\n\n![C.",
  "Here is an image:\n\n![C. Joseph](https://ex",
  "Here is an image:\n\n![C. Joseph](https://example.com/image.jpg)",
  "Here is an image:\n\n![C. Joseph](https://example.com/image.jpg)\n\nMore text follows."
];

console.log("=== Testing Streaming Steps ===");
for (let i = 0; i < streamSteps.length; i++) {
  const md = streamSteps[i];
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
      md
    )
  );
  const hasBadNesting = /<p[^>]*>(?:(?!<\/p>)[\s\S])*?<div/i.test(html);
  console.log(`Step ${i + 1}: ${hasBadNesting ? "FAIL (invalid nesting)" : "PASS (valid)"}`);
  if (hasBadNesting) console.log("HTML:", html);
}
