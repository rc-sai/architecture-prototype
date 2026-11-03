"use client";

import { BLOCKS, BLOCK_DRAG_MIME, type BlockCategory, type BlockKind } from "@/lib/blocks";

const CATEGORIES: BlockCategory[] = ["Hosting", "Serverless", "Data & Storage", "Network"];

export default function Palette({ onAdd }: { onAdd: (kind: BlockKind) => void }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Catalyst components</h2>
        <p className="mt-1 text-xs text-slate-400">Drag onto the canvas, or click to add.</p>
      </div>
      {CATEGORIES.map((category) => (
        <section key={category} className="px-3 py-2">
          <h3 className="px-1 pb-1.5 text-[11px] font-medium text-slate-400">{category}</h3>
          <div className="flex flex-col gap-1.5">
            {BLOCKS.filter((b) => b.category === category).map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.kind}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(BLOCK_DRAG_MIME, block.kind);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onAdd(block.kind)}
                  className="flex cursor-grab items-center gap-2.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-left shadow-xs transition hover:border-slate-300 hover:shadow active:cursor-grabbing"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded text-white" style={{ background: block.color }}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-700">{block.label}</span>
                    <span className="block truncate text-[11px] text-slate-400">{block.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}
