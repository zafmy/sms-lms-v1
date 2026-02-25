// Server Component for rendering Lexical JSON or plain text content as HTML.
// Automatically detects content format and renders accordingly.

import { renderContent } from "@/lib/lexicalRenderer";

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({
  content,
  className,
}: RichTextRendererProps) {
  if (!content) {
    return null;
  }

  const { html, isRichText } = renderContent(content);

  if (!html) {
    return null;
  }

  if (isRichText) {
    return (
      <div
        className={`rich-text-content ${className || ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className={`whitespace-pre-wrap ${className || ""}`}>{content}</div>
  );
}
