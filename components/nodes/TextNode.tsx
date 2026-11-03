"use client";

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { useDiagramStore, type TextNode } from "@/lib/store";

function TextNodeView({ id, data, selected }: NodeProps<TextNode>) {
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNodeData(id, { text: draft });
  };

  return (
    <div
      className={`min-w-24 max-w-72 rounded px-2 py-1 text-sm text-slate-800 ${selected ? "outline-2 outline-dashed outline-blue-500" : ""}`}
      onDoubleClick={() => {
        setDraft(data.text);
        setEditing(true);
      }}
    >
      {editing ? (
        <textarea
          autoFocus
          rows={Math.max(2, draft.split("\n").length)}
          className="nodrag nowheel w-64 resize-none rounded border border-slate-300 bg-white p-1 outline-none focus:border-blue-500"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") commit();
          }}
        />
      ) : (
        <div className="whitespace-pre-wrap break-words">{data.text || " "}</div>
      )}
    </div>
  );
}

export default memo(TextNodeView);
