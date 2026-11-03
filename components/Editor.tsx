"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import type { BlockKind } from "@/lib/blocks";
import { useDiagramStore } from "@/lib/store";
import { useScreenRecorder } from "@/lib/useScreenRecorder";
import Canvas from "./Canvas";
import Palette from "./Palette";
import SubmitDialog from "./SubmitDialog";
import Toolbar, { type CanvasMode } from "./Toolbar";

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function EditorInner() {
  const [mode, setMode] = useState<CanvasMode>("select");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const recorder = useScreenRecorder();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { addCatalystNode, addTextNode, undo, redo, loadDraft, saveDraft } = useDiagramStore.getState();

  // Restore the last draft, then autosave on every change.
  useEffect(() => {
    loadDraft();
    let timer: ReturnType<typeof setTimeout>;
    const unsubscribe = useDiagramStore.subscribe((state, prev) => {
      if (state.nodes === prev.nodes && state.edges === prev.edges) return;
      clearTimeout(timer);
      timer = setTimeout(saveDraft, 400);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [loadDraft, saveDraft]);

  // Flow position at the centre of the canvas, jittered so repeated adds don't stack exactly.
  const canvasCentre = useCallback(() => {
    const rect = document.querySelector(".react-flow")?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const jitter = () => Math.round((Math.random() - 0.5) * 60);
    const p = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    return { x: p.x - 96 + jitter(), y: p.y - 28 + jitter() };
  }, [screenToFlowPosition]);

  const onAddBlock = useCallback((kind: BlockKind) => addCatalystNode(kind, canvasCentre()), [addCatalystNode, canvasCentre]);
  const onAddText = useCallback(() => addTextNode(canvasCentre()), [addTextNode, canvasCentre]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || submitOpen) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        redo();
      } else if (!mod && !e.altKey) {
        if (key === "v") setMode("select");
        else if (key === "h") setMode("pan");
        else if (key === "t") onAddText();
        else if (key === "enter" || key === "f2") {
          const selected = useDiagramStore.getState().nodes.filter((n) => n.selected);
          if (selected.length === 1 && selected[0].type === "catalyst") {
            e.preventDefault();
            useDiagramStore.getState().setEditingNodeId(selected[0].id);
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, onAddText, submitOpen]);

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onAddText={onAddText}
        onFitView={() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 })}
        onSubmit={() => setSubmitOpen(true)}
        recorder={recorder}
        micEnabled={micEnabled}
        onMicToggle={() => setMicEnabled((v) => !v)}
      />
      <div className="flex min-h-0 flex-1">
        <Palette onAdd={onAddBlock} />
        <Canvas mode={mode} />
      </div>
      {submitOpen && <SubmitDialog onClose={() => setSubmitOpen(false)} recorder={recorder} />}
    </div>
  );
}

export default function Editor() {
  return (
    <ReactFlowProvider>
      <EditorInner />
    </ReactFlowProvider>
  );
}
