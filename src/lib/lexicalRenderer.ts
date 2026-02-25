// Server-safe Lexical JSON to HTML renderer.
// Walks the Lexical serialized JSON tree and produces sanitized HTML.
// Does not depend on DOM APIs so it works in Server Components.

import DOMPurify from "isomorphic-dompurify";

// Sanitization allowlists
const ALLOWED_TAGS = [
  "b",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "pre",
  "code",
  "blockquote",
  "br",
  "p",
  "div",
  "span",
  "iframe",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "class",
  "target",
  "rel",
  "width",
  "height",
  "allowfullscreen",
  "frameborder",
];

// Restrict iframe src to YouTube embeds only
DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (
    node.tagName === "IFRAME" &&
    data.attrName === "src" &&
    data.attrValue &&
    !data.attrValue.startsWith("https://www.youtube.com/embed/")
  ) {
    data.attrValue = "";
  }
});

// Check if a string is Lexical JSON
export function isLexicalJSON(content: string): boolean {
  if (!content || !content.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.root !== undefined;
  } catch {
    return false;
  }
}

// Escape HTML entities in plain text
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Format flags used by Lexical text nodes (bitmask)
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;

// Wrap text with inline formatting tags based on Lexical format bitmask
function applyTextFormat(text: string, format: number): string {
  let result = escapeHtml(text);

  if (format & IS_CODE) {
    result = `<code class="editor-text-code">${result}</code>`;
  }
  if (format & IS_BOLD) {
    result = `<b class="editor-text-bold">${result}</b>`;
  }
  if (format & IS_ITALIC) {
    result = `<i class="editor-text-italic">${result}</i>`;
  }
  if (format & IS_UNDERLINE) {
    result = `<u class="editor-text-underline">${result}</u>`;
  }
  if (format & IS_STRIKETHROUGH) {
    result = `<s class="editor-text-strikethrough">${result}</s>`;
  }

  return result;
}

// Render children nodes recursively
function renderChildren(children: any[]): string {
  if (!children || !Array.isArray(children)) return "";
  return children.map((child) => renderNode(child)).join("");
}

// Render a single Lexical node to HTML
function renderNode(node: any): string {
  if (!node || !node.type) return "";

  switch (node.type) {
    case "root":
      return renderChildren(node.children);

    case "paragraph":
      return `<p class="editor-paragraph">${renderChildren(node.children)}</p>`;

    case "heading": {
      const tag = node.tag || "h1";
      const className = `editor-heading-${tag}`;
      return `<${tag} class="${className}">${renderChildren(node.children)}</${tag}>`;
    }

    case "text": {
      const format = node.format || 0;
      return applyTextFormat(node.text || "", format);
    }

    case "linebreak":
      return "<br>";

    case "link": {
      const href = escapeHtml(node.url || "");
      const target = node.target || "_blank";
      const rel = node.rel || "noopener noreferrer";
      return `<a href="${href}" target="${target}" rel="${rel}" class="editor-link">${renderChildren(node.children)}</a>`;
    }

    case "autolink": {
      const href = escapeHtml(node.url || "");
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="editor-link">${renderChildren(node.children)}</a>`;
    }

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      const className =
        node.listType === "number" ? "editor-list-ol" : "editor-list-ul";
      return `<${tag} class="${className}">${renderChildren(node.children)}</${tag}>`;
    }

    case "listitem": {
      const nested = node.children?.some(
        (c: any) => c.type === "list"
      );
      const className = nested
        ? "editor-listitem editor-nested-listitem"
        : "editor-listitem";
      return `<li class="${className}">${renderChildren(node.children)}</li>`;
    }

    case "quote":
      return `<blockquote class="editor-quote">${renderChildren(node.children)}</blockquote>`;

    case "code":
      return `<pre class="editor-code"><code>${renderChildren(node.children)}</code></pre>`;

    case "code-highlight": {
      const highlightType = node.highlightType || "";
      const className = highlightType
        ? `editor-code-highlight editor-token${highlightType.charAt(0).toUpperCase() + highlightType.slice(1)}`
        : "editor-code-highlight";
      return `<span class="${className}">${escapeHtml(node.text || "")}</span>`;
    }

    case "table":
      return `<table class="editor-table"><tbody>${renderChildren(node.children)}</tbody></table>`;

    case "tablerow":
      return `<tr class="editor-table-row">${renderChildren(node.children)}</tr>`;

    case "tablecell": {
      const tag = node.headerState ? "th" : "td";
      const className = node.headerState
        ? "editor-table-cell editor-table-cell-header"
        : "editor-table-cell";
      return `<${tag} class="${className}">${renderChildren(node.children)}</${tag}>`;
    }

    case "image":
      return `<img src="${escapeHtml(node.src || "")}" alt="${escapeHtml(node.altText || "")}" class="editor-image" />`;

    case "youtube":
      return `<div class="editor-youtube"><iframe src="https://www.youtube.com/embed/${escapeHtml(node.videoID || "")}" frameborder="0" allowfullscreen width="560" height="315"></iframe></div>`;

    default:
      // Fallback: render children if available
      if (node.children) {
        return renderChildren(node.children);
      }
      return escapeHtml(node.text || "");
  }
}

// Render content string (Lexical JSON or plain text) to sanitized HTML
export function renderContent(content: string): {
  html: string;
  isRichText: boolean;
} {
  if (!content) return { html: "", isRichText: false };

  if (isLexicalJSON(content)) {
    try {
      const parsed = JSON.parse(content);
      const rawHtml = renderNode(parsed.root);
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
      });
      return { html: sanitizedHtml, isRichText: true };
    } catch {
      // If JSON parsing/rendering fails, fall through to plain text
    }
  }

  // Plain text: escape HTML entities, replace newlines with <br>
  const escaped = escapeHtml(content).replace(/\n/g, "<br>");
  return { html: escaped, isRichText: false };
}
