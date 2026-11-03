"use client";

import type { ReactNode } from "react";
import {
  Circle,
  Eraser,
  Hand,
  Maximize,
  Mic,
  MicOff,
  MousePointer2,
  Redo2,
  Send,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { useDiagramStore } from "@/lib/store";
import { formatDuration } from "@/lib/format";
import type { ScreenRecorder } from "@/lib/useScreenRecorder";

export type CanvasMode = "select" | "pan";

interface ToolbarProps {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  onAddText: () => void;
  onFitView: () => void;
  onSubmit: () => void;
  recorder: ScreenRecorder;
  micEnabled: boolean;
  onMicToggle: () => void;
}

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="mx-1 h-6 w-px bg-slate-200" />;

export default function Toolbar(props: ToolbarProps) {
  const { mode, onModeChange, onAddText, onFitView, onSubmit, recorder, micEnabled, onMicToggle } = props;
  const canUndo = useDiagramStore((s) => s.past.length > 0);
  const canRedo = useDiagramStore((s) => s.future.length > 0);
  const hasNodes = useDiagramStore((s) => s.nodes.length > 0);
  const hasSelection = useDiagramStore((s) => s.nodes.some((n) => n.selected) || s.edges.some((e) => e.selected));
  const { undo, redo, deleteSelected, clear } = useDiagramStore.getState();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="mr-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white">C</div>
        <span className="text-sm font-semibold text-slate-800">Catalyst Architecture Builder</span>
      </div>

      <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
        <ToolButton label="Select" shortcut="V" active={mode === "select"} onClick={() => onModeChange("select")}>
          <MousePointer2 className="size-4" />
        </ToolButton>
        <ToolButton label="Pan" shortcut="H / hold Space" active={mode === "pan"} onClick={() => onModeChange("pan")}>
          <Hand className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Add text" shortcut="T" onClick={onAddText}>
          <Type className="size-4" />
        </ToolButton>
        <ToolButton label="Delete selected" shortcut="Delete" disabled={!hasSelection} onClick={deleteSelected}>
          <Trash2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Redo" shortcut="⌘⇧Z" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Fit to screen" onClick={onFitView} disabled={!hasNodes}>
          <Maximize className="size-4" />
        </ToolButton>
        <ToolButton
          label="Clear canvas"
          disabled={!hasNodes}
          onClick={() => {
            if (confirm("Clear the whole canvas? You can undo this.")) clear();
          }}
        >
          <Eraser className="size-4" />
        </ToolButton>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {recorder.error && <span className="max-w-56 truncate text-xs text-amber-600" title={recorder.error}>{recorder.error}</span>}
        {recorder.supported && (
          <>
            <ToolButton
              label={micEnabled ? "Microphone on" : "Microphone off"}
              active={micEnabled}
              disabled={recorder.recording}
              onClick={onMicToggle}
            >
              {micEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </ToolButton>
            {recorder.recording ? (
              <button
                type="button"
                onClick={() => void recorder.stop()}
                className="flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                <span className="size-2 animate-pulse rounded-full bg-red-600" />
                {formatDuration(recorder.elapsedMs)}
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void recorder.start(micEnabled)}
                className="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Circle className="size-3.5 fill-red-500 text-red-500" />
                {recorder.blob ? "Re-record" : "Record"}
              </button>
            )}
          </>
        )}
        <button
          type="button"
          disabled={!hasNodes}
          onClick={onSubmit}
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="size-4" />
          Submit
        </button>
      </div>
    </header>
  );
}
