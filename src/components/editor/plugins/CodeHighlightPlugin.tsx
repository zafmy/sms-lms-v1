"use client";

// Code highlight plugin for the Lexical editor.
// Registers syntax highlighting for code blocks using @lexical/code.
// @MX:NOTE: [AUTO] Bridges @lexical/code registerCodeHighlighting with React lifecycle
// @MX:SPEC: SPEC-EDITOR-001

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { registerCodeHighlighting } from "@lexical/code";

export default function CodeHighlightPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
}
