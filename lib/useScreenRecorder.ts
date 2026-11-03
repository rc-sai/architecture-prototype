"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

function pickMimeType() {
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

export interface ScreenRecorder {
  supported: boolean;
  recording: boolean;
  elapsedMs: number;
  blob: Blob | null;
  error: string | null;
  start: (withMic: boolean) => Promise<void>;
  /** Stops an active recording and resolves with the final blob (or the existing one). */
  stop: () => Promise<Blob | null>;
  discard: () => void;
}

export function useScreenRecorder({ maxDurationMs = 15 * 60 * 1000 } = {}): ScreenRecorder {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const resolversRef = useRef<((b: Blob | null) => void)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== "undefined");
  }, []);

  const releaseDevices = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  }, []);

  useEffect(() => releaseDevices, [releaseDevices]);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return Promise.resolve(blobRef.current);
    return new Promise<Blob | null>((resolve) => {
      resolversRef.current.push(resolve);
      rec.stop();
    });
  }, []);

  const start = useCallback(
    async (withMic: boolean) => {
      setError(null);
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "browser", frameRate: 15 },
          audio: true,
          preferCurrentTab: true,
        } as DisplayMediaStreamOptions);
        streamsRef.current.push(display);

        let mic: MediaStream | null = null;
        if (withMic) {
          try {
            mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamsRef.current.push(mic);
          } catch {
            setError("Microphone unavailable — recording screen only.");
          }
        }

        // MediaRecorder records a single audio track, so mix tab audio and mic together.
        const audioSources = [display, mic].filter((s): s is MediaStream => !!s && s.getAudioTracks().length > 0);
        let audioTracks: MediaStreamTrack[] = audioSources.flatMap((s) => s.getAudioTracks());
        if (audioSources.length > 1) {
          const ctx = new AudioContext();
          const dest = ctx.createMediaStreamDestination();
          audioSources.forEach((s) => ctx.createMediaStreamSource(s).connect(dest));
          audioCtxRef.current = ctx;
          audioTracks = dest.stream.getAudioTracks();
        }

        const stream = new MediaStream([...display.getVideoTracks(), ...audioTracks]);
        const mimeType = pickMimeType();
        const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 });
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        rec.onstop = () => {
          const result = new Blob(chunks, { type: rec.mimeType || mimeType || "video/webm" });
          blobRef.current = result;
          setBlob(result);
          setRecording(false);
          releaseDevices();
          resolversRef.current.forEach((r) => r(result));
          resolversRef.current = [];
        };
        // The user can end sharing from the browser's own "Stop sharing" bar.
        display.getVideoTracks()[0]?.addEventListener("ended", () => void stop());

        recorderRef.current = rec;
        blobRef.current = null;
        setBlob(null);
        rec.start(1000);
        setRecording(true);

        const startedAt = Date.now();
        setElapsedMs(0);
        timerRef.current = setInterval(() => {
          const elapsed = Date.now() - startedAt;
          setElapsedMs(elapsed);
          if (elapsed >= maxDurationMs) void stop();
        }, 500);
      } catch (err) {
        releaseDevices();
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Screen sharing was cancelled.");
        } else {
          setError(err instanceof Error ? err.message : "Could not start recording.");
        }
      }
    },
    [maxDurationMs, releaseDevices, stop],
  );

  const discard = useCallback(() => {
    blobRef.current = null;
    setBlob(null);
    setElapsedMs(0);
  }, []);

  return { supported, recording, elapsedMs, blob, error, start, stop, discard };
}

export function recordingExtension(blob: Blob) {
  return blob.type.includes("mp4") ? "mp4" : "webm";
}

