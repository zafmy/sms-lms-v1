"use client";

// Image plugin for the Lexical editor.
// Provides a custom DecoratorNode that renders images inline.
// @MX:NOTE: [AUTO] DecoratorNode renders React component via decorate()
// @MX:SPEC: SPEC-EDITOR-001 TASK-016

import type { JSX } from "react";
import {
  $applyNodeReplacement,
  $insertNodes,
  createCommand,
  DecoratorNode,
  COMMAND_PRIORITY_EDITOR,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

// Serialized shape persisted to JSON
export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
  },
  SerializedLexicalNode
>;

// Command dispatched from the toolbar to insert an image
export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string;
  altText: string;
}> = createCommand("INSERT_IMAGE_COMMAND");

// Component rendered inside the editor for each ImageNode
function ImageComponent({ src, altText }: { src: string; altText: string }) {
  return (
    <img
      src={src}
      alt={altText}
      className="editor-image"
      draggable={false}
    />
  );
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const theme = config.theme;
    const className = theme.image;
    if (className) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    img.className = "editor-image";
    return { element: img };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText } = serializedNode;
    return $createImageNode(src, altText);
  }

  exportJSON(): SerializedImageNode {
    return {
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <ImageComponent src={this.__src} altText={this.__altText} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createImageNode(src: string, altText: string): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText));
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}

// Plugin that registers the INSERT_IMAGE_COMMAND listener
export default function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload.src, payload.altText);
        $insertNodes([imageNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
