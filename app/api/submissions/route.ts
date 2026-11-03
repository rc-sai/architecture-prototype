import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { submissionMetaSchema, type SubmissionRecord } from "@/lib/schema";
import { listSubmissions, submissionDir } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_RECORDING_BYTES = 500 * 1024 * 1024;

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function GET() {
  return NextResponse.json(await listSubmissions());
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected multipart form data");
  }

  const metaRaw = form.get("meta");
  if (typeof metaRaw !== "string") return badRequest("Missing submission metadata");
  let metaJson: unknown;
  try {
    metaJson = JSON.parse(metaRaw);
  } catch {
    return badRequest("Submission metadata is not valid JSON");
  }
  const parsed = submissionMetaSchema.safeParse(metaJson);
  if (!parsed.success) return badRequest(parsed.error.issues.map((i) => i.message).join("; "));

  const image = form.get("image");
  const recording = form.get("recording");
  if (image instanceof File && (image.type !== "image/png" || image.size > MAX_IMAGE_BYTES)) {
    return badRequest("Diagram image must be a PNG under 20 MB");
  }
  if (recording instanceof File && (!recording.type.startsWith("video/") || recording.size > MAX_RECORDING_BYTES)) {
    return badRequest("Recording must be a video under 500 MB");
  }

  const id = nanoid(10);
  const dir = submissionDir(id);
  await mkdir(dir, { recursive: true });

  const files: SubmissionRecord["files"] = {};
  if (image instanceof File) {
    files.image = "diagram.png";
    await writeFile(path.join(dir, files.image), Buffer.from(await image.arrayBuffer()));
  }
  if (recording instanceof File) {
    files.recording = recording.type.includes("mp4") ? "recording.mp4" : "recording.webm";
    await writeFile(path.join(dir, files.recording), Buffer.from(await recording.arrayBuffer()));
  }

  const record: SubmissionRecord = { ...parsed.data, id, receivedAt: new Date().toISOString(), files };
  await writeFile(path.join(dir, "submission.json"), JSON.stringify(record, null, 2));

  return NextResponse.json({ id }, { status: 201 });
}
