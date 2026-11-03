"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { Loader2, X } from "lucide-react";
import { exportDiagramPng } from "@/lib/exportImage";
import { useDiagramStore } from "@/lib/store";
import { formatDuration } from "@/lib/format";
import { recordingExtension, type ScreenRecorder } from "@/lib/useScreenRecorder";

// Selection/drag flags are editor UI state, not part of the submitted diagram.
function withoutUiState<T extends { selected?: boolean; dragging?: boolean }>(item: T): T {
  const copy = { ...item };
  delete copy.selected;
  delete copy.dragging;
  return copy;
}

export default function SubmitDialog({ onClose, recorder }: { onClose: () => void; recorder: ScreenRecorder }) {
  const router = useRouter();
  const { getNodes, getViewport } = useReactFlow();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (recorder.blob ? URL.createObjectURL(recorder.blob) : null), [recorder.blob]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const recordingDurationMs = recorder.recording || recorder.blob ? recorder.elapsedMs : undefined;
      const recording = recorder.recording ? await recorder.stop() : recorder.blob;
      const { nodes, edges } = useDiagramStore.getState();
      const image = await exportDiagramPng(getNodes());

      const form = new FormData();
      form.append(
        "meta",
        JSON.stringify({
          participant: { name, email },
          notes,
          diagram: {
            nodes: nodes.map(withoutUiState),
            edges: edges.map(withoutUiState),
            viewport: getViewport(),
          },
          recordingDurationMs,
        }),
      );
      if (image) form.append("image", image, "diagram.png");
      if (recording) form.append("recording", recording, `recording.${recordingExtension(recording)}`);

      const res = await fetch("/api/submissions", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Submission failed");

      useDiagramStore.getState().discardDraft();
      recorder.discard();
      router.push(`/submissions/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={busy ? undefined : onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Submit your architecture</h2>
            <p className="text-sm text-slate-500">Your diagram{recorder.blob || recorder.recording ? " and screen recording" : ""} will be sent for review.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Notes for the reviewer
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-blue-500"
            />
          </label>

          {recorder.recording && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              Recording in progress ({formatDuration(recorder.elapsedMs)}). It will be stopped and attached when you submit.
            </p>
          )}
          {previewUrl && (
            <div className="rounded-md border border-slate-200 p-2">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>Screen recording · {formatDuration(recorder.elapsedMs)}</span>
                <button type="button" onClick={recorder.discard} className="text-red-600 hover:underline">
                  Remove
                </button>
              </div>
              <video src={previewUrl} controls className="max-h-40 w-full rounded bg-black" />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
