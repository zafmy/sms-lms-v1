"use client";

// YouTube embed plugin for the Lexical editor.
// Provides a custom DecoratorNode that renders a responsive YouTube iframe.
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
export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
  },
  SerializedLexicalNode
>;

// Command dispatched from the toolbar to insert a YouTube embed
export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> =
  createCommand("INSERT_YOUTUBE_COMMAND");

// Extract video ID from various YouTube URL formats
export function extractYouTubeVideoID(url: string): string | null {
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Component rendered inside the editor for each YouTubeNode
function YouTubeComponent({ videoID }: { videoID: string }) {
  return (
    <div className="editor-youtube">
      <iframe
        src={`https://www.youtube.com/embed/${videoID}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`YouTube video ${videoID}`}
        width="560"
        height="315"
      />
    </div>
  );
}

export class YouTubeNode extends DecoratorNode<JSX.Element> {
  __videoID: string;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoID, node.__key);
  }

  constructor(videoID: string, key?: NodeKey) {
    super(key);
    this.__videoID = videoID;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = "editor-youtube";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const container = document.createElement("div");
    container.className = "editor-youtube";
    const iframe = document.createElement("iframe");
    iframe.setAttribute(
      "src",
      `https://www.youtube.com/embed/${this.__videoID}`
    );
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("width", "560");
    iframe.setAttribute("height", "315");
    container.appendChild(iframe);
    return { element: container };
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const { videoID } = serializedNode;
    return $createYouTubeNode(videoID);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      type: "youtube",
      version: 1,
      videoID: this.__videoID,
    };
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return <YouTubeComponent videoID={this.__videoID} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return $applyNodeReplacement(new YouTubeNode(videoID));
}

export function $isYouTubeNode(
  node: LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}

// Plugin that registers the INSERT_YOUTUBE_COMMAND listener
export default function YouTubePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (videoID) => {
        const youtubeNode = $createYouTubeNode(videoID);
        $insertNodes([youtubeNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
