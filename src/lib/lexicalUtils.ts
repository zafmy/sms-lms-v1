// Utility functions for working with Lexical JSON content.
// Used for text extraction, truncation, and content preview.

import { isLexicalJSON } from "./lexicalRenderer";

// Recursively extract plain text from a Lexical node tree
function extractTextFromNode(node: any): string {
  if (!node) return "";

  if (node.type === "text") {
    return node.text || "";
  }

  if (node.type === "linebreak") {
    return "\n";
  }

  if (node.children && Array.isArray(node.children)) {
    const childTexts = node.children.map(extractTextFromNode);
    const joined = childTexts.join("");

    // Add newline after block-level elements
    const blockTypes = [
      "paragraph",
      "heading",
      "listitem",
      "quote",
      "code",
    ];
    if (blockTypes.includes(node.type)) {
      return joined + "\n";
    }

    return joined;
  }

  return "";
}

// Extract plain text from a Lexical JSON string
export function extractPlainText(jsonString: string): string {
  if (!jsonString) return "";

  if (!isLexicalJSON(jsonString)) {
    return jsonString;
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.root) return jsonString;

    return extractTextFromNode(parsed.root).trim();
  } catch {
    return jsonString;
  }
}

// Truncate content to a maximum length with ellipsis
export function truncateContent(
  content: string,
  maxLength: number
): string {
  if (!content) return "";

  const plainText = isLexicalJSON(content)
    ? extractPlainText(content)
    : content;

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trimEnd() + "...";
}
