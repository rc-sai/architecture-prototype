"use client";

import { memo, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pencil } from "lucide-react";
import { BLOCKS_BY_KIND } from "@/lib/blocks";
import { useDiagramStore, type CatalystNode } from "@/lib/store";

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

function CatalystNodeView({ id, data, selected }: NodeProps<CatalystNode>) {
  const def = BLOCKS_BY_KIND[data.kind];
  const Icon = def.icon;
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);
  const setEditingNodeId = useDiagramStore((s) => s.setEditingNodeId);
  const editing = useDiagramStore((s) => s.editingNodeId === id);
  const inputRef = useRef<HTMLInputElement>(null);
  const renamed = data.label !== def.label;

  // React Flow keeps a new node hidden until it is measured, which defeats autoFocus; retry for a few frames.
  useEffect(() => {
    if (!editing) return;
    let frame = 0;
    let attempts = 0;
    const tryFocus = () => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      if (document.activeElement === input) input.select();
      else if (++attempts < 30) frame = requestAnimationFrame(tryFocus);
    };
    tryFocus();
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  const finish = (save: boolean) => {
    const label = inputRef.current?.value.trim() || def.label;
    setEditingNodeId(null);
    if (save && label !== data.label) updateNodeData(id, { label });
  };

  return (
    <div
      className="group flex w-max min-w-52 max-w-80 items-center gap-2.5 rounded-lg border-2 bg-white px-3 py-2.5 shadow-sm transition-shadow"
      style={{ borderColor: selected || editing ? def.color : "#e2e8f0", boxShadow: selected ? `0 0 0 3px ${def.color}33` : undefined }}
      onDoubleClick={() => setEditingNodeId(id)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md text-white" style={{ background: def.color }}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            defaultValue={data.label}
            placeholder={`Name this ${def.label}`}
            aria-label={`Name for ${def.label}`}
            onBlur={() => finish(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") finish(true);
              if (e.key === "Escape") finish(false);
            }}
            className="nodrag w-full rounded border border-slate-300 px-1 text-sm font-medium outline-none focus:border-blue-500"
          />
        ) : (
          <div className="truncate text-sm font-medium text-slate-800" title={data.label}>
            {data.label}
          </div>
        )}
        {/* Once renamed, the subtitle keeps the Catalyst type visible. */}
        <div className="truncate text-[11px] text-slate-500">{renamed ? def.label : def.description}</div>
      </div>
      {!editing && (
        <button
          type="button"
          title="Rename (double-click, Enter or F2)"
          aria-label={`Rename ${data.label}`}
          onClick={() => setEditingNodeId(id)}
          className={`nodrag flex size-6 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <Pencil className="size-3.5" />
        </button>
      )}
      {SIDES.map((side) => (
        <Handle key={side} id={side} type="source" position={side} className="catalyst-handle" />
      ))}
    </div>
  );
}

export default memo(CatalystNodeView);
