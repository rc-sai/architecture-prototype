import { z } from "zod";

const nodeSchema = z.looseObject({
  id: z.string(),
  type: z.enum(["catalyst", "text"]),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.string(), z.unknown()),
});

const edgeSchema = z.looseObject({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

export const submissionMetaSchema = z.object({
  participant: z.object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.union([z.email(), z.literal("")]).optional(),
  }),
  notes: z.string().max(2000).optional(),
  diagram: z.object({
    nodes: z.array(nodeSchema).min(1, "Diagram is empty").max(500),
    edges: z.array(edgeSchema).max(2000),
    viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  }),
  recordingDurationMs: z.number().nonnegative().optional(),
});

export type SubmissionMeta = z.infer<typeof submissionMetaSchema>;

export type SubmissionRecord = SubmissionMeta & {
  id: string;
  receivedAt: string;
  files: { image?: string; recording?: string };
};
