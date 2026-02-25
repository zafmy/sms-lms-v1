"use client";

// Toolbar UI with formatting buttons for the rich text editor.
// Receives state and callbacks from ToolbarPlugin.

import { useTranslations } from "next-intl";
import type { TextFormatType } from "lexical";
import type { HeadingTagType } from "@lexical/rich-text";
import type { BlockType } from "./plugins/ToolbarPlugin";

interface ToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  blockType: BlockType;
}

interface EditorToolbarProps {
  variant: "full" | "compact";
  toolbarState: ToolbarState;
  onFormatText: (format: TextFormatType) => void;
  onFormatHeading: (tag: HeadingTagType) => void;
  onFormatQuote: () => void;
  onFormatCode: () => void;
  onInsertOrderedList: () => void;
  onInsertUnorderedList: () => void;
  onInsertLink: () => void;
  onInsertTable: () => void;
  onInsertImage: () => void;
  onInsertYouTube: () => void;
}

function ToolbarButton({
  onClick,
  isActive,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`p-1.5 rounded text-sm transition-colors ${
        isActive
          ? "bg-gray-200 text-gray-900"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-300 mx-1" />;
}

export default function EditorToolbar({
  variant,
  toolbarState,
  onFormatText,
  onFormatHeading,
  onFormatQuote,
  onFormatCode,
  onInsertOrderedList,
  onInsertUnorderedList,
  onInsertLink,
  onInsertTable,
  onInsertImage,
  onInsertYouTube,
}: EditorToolbarProps) {
  const t = useTranslations("editor");

  return (
    <div
      role="toolbar"
      aria-label={t("aria.textFormatting")}
      className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-gray-300 bg-gray-50 rounded-t-md"
    >
      {/* Headings -- full variant only */}
      {variant === "full" && (
        <>
          <ToolbarButton
            onClick={() => onFormatHeading("h1")}
            isActive={toolbarState.blockType === "h1"}
            ariaLabel={t("toolbar.heading1")}
          >
            <span className="font-bold text-base">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => onFormatHeading("h2")}
            isActive={toolbarState.blockType === "h2"}
            ariaLabel={t("toolbar.heading2")}
          >
            <span className="font-bold text-sm">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => onFormatHeading("h3")}
            isActive={toolbarState.blockType === "h3"}
            ariaLabel={t("toolbar.heading3")}
          >
            <span className="font-bold text-xs">H3</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => onFormatHeading("h4")}
            isActive={toolbarState.blockType === "h4"}
            ariaLabel={t("toolbar.heading4")}
          >
            <span className="font-semibold text-xs">H4</span>
          </ToolbarButton>
          <Divider />
        </>
      )}

      {/* Inline formatting -- both variants */}
      <ToolbarButton
        onClick={() => onFormatText("bold")}
        isActive={toolbarState.isBold}
        ariaLabel={t("toolbar.bold")}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormatText("italic")}
        isActive={toolbarState.isItalic}
        ariaLabel={t("toolbar.italic")}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormatText("underline")}
        isActive={toolbarState.isUnderline}
        ariaLabel={t("toolbar.underline")}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onFormatText("strikethrough")}
        isActive={toolbarState.isStrikethrough}
        ariaLabel={t("toolbar.strikethrough")}
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <Divider />

      {/* Lists -- both variants */}
      <ToolbarButton
        onClick={onInsertOrderedList}
        isActive={toolbarState.blockType === "ol"}
        ariaLabel={t("toolbar.orderedList")}
      >
        <span className="text-xs font-mono">1.</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={onInsertUnorderedList}
        isActive={toolbarState.blockType === "ul"}
        ariaLabel={t("toolbar.unorderedList")}
      >
        <span className="text-xs font-mono">&#8226;</span>
      </ToolbarButton>

      {/* Link -- both variants */}
      <ToolbarButton
        onClick={onInsertLink}
        isActive={toolbarState.isLink}
        ariaLabel={t("toolbar.link")}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      </ToolbarButton>

      {/* Inline code -- both variants */}
      <ToolbarButton
        onClick={() => onFormatText("code")}
        isActive={toolbarState.isCode}
        ariaLabel={t("toolbar.inlineCode")}
      >
        <span className="font-mono text-xs">&lt;/&gt;</span>
      </ToolbarButton>

      {/* Full variant extras */}
      {variant === "full" && (
        <>
          <Divider />

          {/* Quote */}
          <ToolbarButton
            onClick={onFormatQuote}
            isActive={toolbarState.blockType === "quote"}
            ariaLabel={t("toolbar.blockQuote")}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </ToolbarButton>

          {/* Code Block */}
          <ToolbarButton
            onClick={onFormatCode}
            isActive={toolbarState.blockType === "code"}
            ariaLabel={t("toolbar.codeBlock")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </ToolbarButton>

          {/* Table */}
          <ToolbarButton
            onClick={onInsertTable}
            isActive={false}
            ariaLabel={t("toolbar.insertTable")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18M3 6h18M3 18h18M10 6v12M14 6v12"
              />
            </svg>
          </ToolbarButton>

          {/* Image */}
          <ToolbarButton
            onClick={onInsertImage}
            isActive={false}
            ariaLabel={t("toolbar.insertImage")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </ToolbarButton>

          {/* YouTube */}
          <ToolbarButton
            onClick={onInsertYouTube}
            isActive={false}
            ariaLabel={t("toolbar.embedYouTube")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </ToolbarButton>
        </>
      )}
    </div>
  );
}
