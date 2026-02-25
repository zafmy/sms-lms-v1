"use client";

// Toolbar plugin that tracks editor selection state and provides
// formatting commands. Renders the EditorToolbar with current state.

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  $findMatchingParent,
  $getNearestNodeOfType,
} from "@lexical/utils";
import EditorToolbar from "../EditorToolbar";
import { INSERT_IMAGE_COMMAND } from "./ImagePlugin";
import {
  INSERT_YOUTUBE_COMMAND,
  extractYouTubeVideoID,
} from "./YouTubePlugin";

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "quote"
  | "code"
  | "ol"
  | "ul";

interface ToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  blockType: BlockType;
}

interface ToolbarPluginProps {
  variant: "full" | "compact";
}

export default function ToolbarPlugin({ variant }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const t = useTranslations("editor");

  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    isLink: false,
    blockType: "paragraph",
  });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const isBold = selection.hasFormat("bold");
      const isItalic = selection.hasFormat("italic");
      const isUnderline = selection.hasFormat("underline");
      const isStrikethrough = selection.hasFormat("strikethrough");
      const isCode = selection.hasFormat("code");

      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && parent.getKey() === "root";
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      let blockType: BlockType = "paragraph";

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          blockType = type === "number" ? "ol" : "ul";
        } else if ($isHeadingNode(element)) {
          const tag = element.getTag() as HeadingTagType;
          blockType = tag as BlockType;
        } else if ($isCodeNode(element)) {
          blockType = "code";
        }
      }

      // Check for link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);

      setToolbarState({
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough,
        isCode,
        isLink,
        blockType,
      });
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const formatHeading = useCallback(
    (headingTag: HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (toolbarState.blockType === headingTag) {
            // Toggle off -- convert back to paragraph
            $setBlocksType(selection, () => $createParagraphNode());
          } else {
            $setBlocksType(selection, () => $createHeadingNode(headingTag));
          }
        }
      });
    },
    [editor, toolbarState.blockType]
  );

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (toolbarState.blockType === "quote") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  }, [editor, toolbarState.blockType]);

  const formatCode = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (toolbarState.blockType === "code") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createCodeNode());
        }
      }
    });
  }, [editor, toolbarState.blockType]);

  const insertOrderedList = useCallback(() => {
    if (toolbarState.blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  }, [editor, toolbarState.blockType]);

  const insertUnorderedList = useCallback(() => {
    if (toolbarState.blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  }, [editor, toolbarState.blockType]);

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      const url = prompt(t("prompts.enterUrl"));
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, toolbarState.isLink, t]);

  const insertTable = useCallback(() => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: "3",
      rows: "3",
      includeHeaders: true,
    });
  }, [editor]);

  const insertImage = useCallback(() => {
    const src = prompt(t("prompts.enterImageUrl"));
    if (src) {
      const altText = prompt(t("prompts.enterImageAlt")) || "";
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src, altText });
    }
  }, [editor, t]);

  const insertYouTube = useCallback(() => {
    const url = prompt(t("prompts.enterYouTubeUrl"));
    if (url) {
      const videoID = extractYouTubeVideoID(url);
      if (videoID) {
        editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, videoID);
      } else {
        alert(t("prompts.invalidYouTubeUrl"));
      }
    }
  }, [editor, t]);

  return (
    <EditorToolbar
      variant={variant}
      toolbarState={toolbarState}
      onFormatText={formatText}
      onFormatHeading={formatHeading}
      onFormatQuote={formatQuote}
      onFormatCode={formatCode}
      onInsertOrderedList={insertOrderedList}
      onInsertUnorderedList={insertUnorderedList}
      onInsertLink={insertLink}
      onInsertTable={insertTable}
      onInsertImage={insertImage}
      onInsertYouTube={insertYouTube}
    />
  );
}
