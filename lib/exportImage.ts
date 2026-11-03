import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng } from "html-to-image";

const PADDING = 80;
const MAX_SIDE = 4000;

/** Renders every node and edge (not just the visible area) to a PNG blob. */
export async function exportDiagramPng(nodes: Node[]): Promise<Blob | null> {
  const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewportEl || nodes.length === 0) return null;

  const bounds = getNodesBounds(nodes);
  const width = Math.min(Math.max(bounds.width + PADDING * 2, 800), MAX_SIDE);
  const height = Math.min(Math.max(bounds.height + PADDING * 2, 500), MAX_SIDE);
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2, 0.1);

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: "#ffffff",
    width,
    height,
    pixelRatio: 2,
    // Connection dots are editing affordances; leave them out of the picture.
    filter: (el) => !(el instanceof Element && el.classList.contains("react-flow__handle")),
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });
  return (await fetch(dataUrl)).blob();
}
