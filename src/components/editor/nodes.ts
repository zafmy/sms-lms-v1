// Lexical node registrations for the editor
// Registers all built-in node types used by the editor plugins

import type { Klass, LexicalNode } from "lexical";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { ImageNode } from "./plugins/ImagePlugin";
import { YouTubeNode } from "./plugins/YouTubePlugin";

// All node types registered for the editor
const editorNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  AutoLinkNode,
  LinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  ImageNode,
  YouTubeNode,
];

export default editorNodes;
