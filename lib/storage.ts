import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { SubmissionRecord } from "./schema";

// Prototype storage on local disk. Replace with Catalyst Data Store + Stratus for production.
export const SUBMISSIONS_DIR = path.join(process.cwd(), "data", "submissions");

export const SUBMISSION_FILES = {
  "diagram.png": "image/png",
  "recording.webm": "video/webm",
  "recording.mp4": "video/mp4",
} as const;

export type SubmissionFileName = keyof typeof SUBMISSION_FILES;

const ID_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

export function isValidSubmissionId(id: string) {
  return ID_PATTERN.test(id);
}

export function submissionDir(id: string) {
  return path.join(SUBMISSIONS_DIR, id);
}

export async function readSubmission(id: string): Promise<SubmissionRecord | null> {
  if (!isValidSubmissionId(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(submissionDir(id), "submission.json"), "utf8"));
  } catch {
    return null;
  }
}

export async function listSubmissions(): Promise<SubmissionRecord[]> {
  let ids: string[];
  try {
    ids = await readdir(SUBMISSIONS_DIR);
  } catch {
    return [];
  }
  const records = await Promise.all(ids.map(readSubmission));
  return records
    .filter((r): r is SubmissionRecord => r !== null)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}
