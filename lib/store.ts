import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import { BLOCKS_BY_KIND, type BlockKind } from "./blocks";

export type CatalystNodeData = { kind: BlockKind; label: string };
export type TextNodeData = { text: string };
export type CatalystNode = Node<CatalystNodeData, "catalyst">;
export type TextNode = Node<TextNodeData, "text">;
export type AppNode = CatalystNode | TextNode;

type Snapshot = { nodes: AppNode[]; edges: Edge[] };

const HISTORY_LIMIT = 100;
const DRAFT_KEY = "catalyst-diagram-draft";

export const EDGE_DEFAULTS = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  style: { strokeWidth: 2 },
} satisfies Partial<Edge>;

interface DiagramState {
  nodes: AppNode[];
  edges: Edge[];
  past: Snapshot[];
  future: Snapshot[];
  /** Block whose name field is open; set on drop so new blocks get named straight away. */
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;

  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  /** Record the current state so the next mutation can be undone. */
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  addCatalystNode: (kind: BlockKind, position: XYPosition) => void;
  addTextNode: (position: XYPosition) => void;
  updateNodeData: (id: string, patch: Partial<CatalystNodeData> | Partial<TextNodeData>) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  deleteSelected: () => void;
  clear: () => void;

  loadDraft: () => void;
  saveDraft: () => void;
  discardDraft: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  editingNodeId: null,
  setEditingNodeId: (id) => set({ editingNodeId: id }),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    get().takeSnapshot();
    set({ edges: addEdge({ ...connection, ...EDGE_DEFAULTS, id: `e-${nanoid(8)}` }, get().edges) });
  },

  takeSnapshot: () => {
    const { nodes, edges, past } = get();
    set({ past: [...past.slice(-HISTORY_LIMIT + 1), { nodes, edges }], future: [] });
  },
  undo: () => {
    const { past, future, nodes, edges } = get();
    const prev = past.at(-1);
    if (!prev) return;
    set({ ...prev, past: past.slice(0, -1), future: [{ nodes, edges }, ...future] });
  },
  redo: () => {
    const { past, future, nodes, edges } = get();
    const next = future[0];
    if (!next) return;
    set({ ...next, past: [...past, { nodes, edges }], future: future.slice(1) });
  },

  addCatalystNode: (kind, position) => {
    get().takeSnapshot();
    const base = BLOCKS_BY_KIND[kind].label;
    const sameKind = get().nodes.filter((n) => n.type === "catalyst" && n.data.kind === kind).length;
    const node: CatalystNode = {
      id: `n-${nanoid(8)}`,
      type: "catalyst",
      position,
      data: { kind, label: sameKind ? `${base} ${sameKind + 1}` : base },
    };
    set({ nodes: [...get().nodes, node], editingNodeId: node.id });
  },
  addTextNode: (position) => {
    get().takeSnapshot();
    const node: TextNode = { id: `t-${nanoid(8)}`, type: "text", position, data: { text: "Double-click to edit" } };
    set({ nodes: [...get().nodes, node] });
  },
  updateNodeData: (id, patch) => {
    get().takeSnapshot();
    set({
      nodes: get().nodes.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AppNode) : n)),
    });
  },
  updateEdgeLabel: (id, label) => {
    get().takeSnapshot();
    set({ edges: get().edges.map((e) => (e.id === id ? { ...e, label: label || undefined } : e)) });
  },
  deleteSelected: () => {
    const { nodes, edges } = get();
    const removedIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    const keptEdges = edges.filter((e) => !e.selected && !removedIds.has(e.source) && !removedIds.has(e.target));
    if (removedIds.size === 0 && keptEdges.length === edges.length) return;
    get().takeSnapshot();
    set({ nodes: nodes.filter((n) => !removedIds.has(n.id)), edges: keptEdges });
  },
  clear: () => {
    get().takeSnapshot();
    set({ nodes: [], edges: [] });
  },

  loadDraft: () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const { nodes, edges } = JSON.parse(raw) as Snapshot;
      if (Array.isArray(nodes) && Array.isArray(edges)) set({ nodes, edges, past: [], future: [] });
    } catch {
      // Corrupt or inaccessible draft: start fresh.
    }
  },
  saveDraft: () => {
    try {
      const { nodes, edges } = get();
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ nodes, edges }));
    } catch {
      // Storage full or blocked; autosave is best-effort.
    }
  },
  discardDraft: () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    set({ nodes: [], edges: [], past: [], future: [] });
  },
}));
