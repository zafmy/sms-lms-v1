"use client";

// Main rich text editor component built on Lexical.
// Supports full and compact variants with serialized JSON output.

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import type { EditorState, SerializedEditorState } from "lexical";

import editorTheme from "./theme";
import editorNodes from "./nodes";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import ImagePlugin from "./plugins/ImagePlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import CodeHighlightPlugin from "./plugins/CodeHighlightPlugin";

export interface RichTextEditorProps {
  initialContent?: string;
  onChange: (jsonString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  variant?: "full" | "compact";
}

// Parse initial content into Lexical editor state JSON string
function getInitialEditorState(content?: string): string | undefined {
  if (!content) return undefined;

  try {
    const parsed = JSON.parse(content);
    if (parsed.root) {
      // Already Lexical JSON format
      return content;
    }
  } catch {
    // Not JSON -- treat as plain text
  }

  // Convert plain text to a Lexical paragraph structure
  const paragraphs = content.split("\n").map((line) => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: line,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
  }));

  return JSON.stringify({
    root: {
      children: paragraphs,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
}

export function RichTextEditor({
  initialContent,
  onChange,
  placeholder,
  disabled = false,
  error,
  label,
  variant = "full",
}: RichTextEditorProps) {
  const te = useTranslations("editor");
  const resolvedPlaceholder = placeholder ?? te("placeholder");
  const initialEditorStateStr = getInitialEditorState(initialContent);

  const initialConfig = {
    namespace: "RichTextEditor",
    theme: editorTheme,
    nodes: editorNodes,
    editable: !disabled,
    editorState: initialEditorStateStr,
    onError: (err: Error) => {
      console.error("Lexical editor error:", err);
    },
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const json: SerializedEditorState = editorState.toJSON();
      onChange(JSON.stringify(json));
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="text-xs text-gray-500">{label}</label>}
      <div
        className={`editor-container ${
          error ? "ring-red-400" : "ring-gray-300"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin variant={variant} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="editor-input"
                  role="textbox"
                  aria-multiline={true}
                  {...(label ? { "aria-label": label } : {})}
                />
              }
              placeholder={
                <div className="editor-placeholder">{resolvedPlaceholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TabIndentationPlugin />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          {variant === "full" && <TablePlugin />}
          {variant === "full" && <ImagePlugin />}
          {variant === "full" && <YouTubePlugin />}
          <CodeHighlightPlugin />
        </LexicalComposer>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
