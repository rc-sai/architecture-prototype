"use client";

import { useCallback, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
} from "@xyflow/react";
import { MousePointerClick } from "lucide-react";
import { BLOCK_DRAG_MIME, BLOCKS_BY_KIND, isBlockKind } from "@/lib/blocks";
import { EDGE_DEFAULTS, useDiagramStore, type AppNode } from "@/lib/store";
import CatalystNode from "./nodes/CatalystNode";
import TextNode from "./nodes/TextNode";
import type { CanvasMode } from "./Toolbar";

const nodeTypes = { catalyst: CatalystNode, text: TextNode };

export default function Canvas({ mode }: { mode: CanvasMode }) {
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const { onNodesChange, onEdgesChange, onConnect, takeSnapshot, addCatalystNode, updateEdgeLabel } =
    useDiagramStore.getState();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer.types.includes(BLOCK_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      const kind = e.dataTransfer.getData(BLOCK_DRAG_MIME);
      if (!isBlockKind(kind)) return;
      e.preventDefault();
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      // Centre the 192x56 node on the cursor.
      addCatalystNode(kind, { x: position.x - 96, y: position.y - 28 });
    },
    [screenToFlowPosition, addCatalystNode],
  );

  const onEdgeDoubleClick = useCallback(
    (_: unknown, edge: Edge) => {
      const label = prompt("Connection label (e.g. HTTPS, reads, triggers):", String(edge.label ?? ""));
      if (label !== null) updateEdgeLabel(edge.id, label.trim());
    },
    [updateEdgeLabel],
  );

  return (
    <div className="relative flex-1" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow<AppNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={takeSnapshot}
        onSelectionDragStart={takeSnapshot}
        onBeforeDelete={async () => {
          takeSnapshot();
          return true;
        }}
        onEdgeDoubleClick={onEdgeDoubleClick}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={EDGE_DEFAULTS}
        deleteKeyCode={["Backspace", "Delete"]}
        panOnDrag={mode === "pan" ? true : [1, 2]}
        selectionOnDrag={mode === "select"}
        panOnScroll
        zoomOnDoubleClick={false}
        snapToGrid
        snapGrid={[8, 8]}
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="#cbd5e1" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => (n.type === "catalyst" ? BLOCKS_BY_KIND[(n as AppNode & { type: "catalyst" }).data.kind].color : "#94a3b8")}
        />
      </ReactFlow>
      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <MousePointerClick className="size-8" />
          <p className="text-sm font-medium">Drag Catalyst components here to start your architecture</p>
          <p className="text-xs">Name each block as you drop it · Connect blocks by dragging between the dots · Double-click an arrow to label it</p>
        </div>
      )}
    </div>
  );
}
