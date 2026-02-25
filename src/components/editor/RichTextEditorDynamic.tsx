"use client";

// Dynamic import wrapper for RichTextEditor.
// Disables SSR since Lexical requires browser DOM APIs.

import dynamic from "next/dynamic";

const RichTextEditorDynamic = dynamic(
  () => import("./RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="ring-[1.5px] ring-gray-300 rounded-md p-2 h-48 animate-pulse bg-gray-50" />
    ),
  }
);

export default RichTextEditorDynamic;
