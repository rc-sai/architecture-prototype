import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOCKS_BY_KIND, isBlockKind } from "@/lib/blocks";
import { readSubmission } from "@/lib/storage";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await readSubmission(id);
  if (!submission) notFound();

  const { participant, notes, diagram, files, receivedAt, recordingDurationMs } = submission;
  const fileUrl = (name: string) => `/api/submissions/${id}/files/${name}`;

  const counts = new Map<string, number>();
  for (const node of diagram.nodes) {
    const kind = String(node.data.kind ?? "");
    const label = node.type === "text" ? "Text notes" : isBlockKind(kind) ? BLOCKS_BY_KIND[kind].label : "Unknown";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-green-700">✓ Submission received</p>
          <h1 className="text-2xl font-semibold text-slate-800">{participant.name}&apos;s architecture</h1>
          <p className="text-sm text-slate-500">
            {participant.email ? `${participant.email} · ` : ""}
            {new Date(receivedAt).toLocaleString()} · ID <code>{id}</code>
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/submissions" className="rounded-md border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50">
            All submissions
          </Link>
          <Link href="/" className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
            New diagram
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-6">
          {files.image && (
            <section className="overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(files.image)} alt="Submitted architecture diagram" className="w-full bg-white" />
            </section>
          )}
          {files.recording && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">
                Screen recording{recordingDurationMs ? ` · ${formatDuration(recordingDurationMs)}` : ""}
              </h2>
              <video src={fileUrl(files.recording)} controls className="w-full rounded-xl bg-black" />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 text-sm">
          <section className="rounded-xl border border-slate-200 p-4">
            <h2 className="mb-2 font-semibold text-slate-700">Components</h2>
            <ul className="space-y-1 text-slate-600">
              {[...counts].map(([label, n]) => (
                <li key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className="text-slate-400">×{n}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-slate-100 pt-1">
                <span>Connections</span>
                <span className="text-slate-400">×{diagram.edges.length}</span>
              </li>
            </ul>
          </section>
          {notes && (
            <section className="rounded-xl border border-slate-200 p-4">
              <h2 className="mb-2 font-semibold text-slate-700">Notes</h2>
              <p className="whitespace-pre-wrap text-slate-600">{notes}</p>
            </section>
          )}
          <details className="rounded-xl border border-slate-200 p-4">
            <summary className="cursor-pointer font-semibold text-slate-700">Diagram JSON</summary>
            <pre className="mt-2 max-h-96 overflow-auto text-xs text-slate-600">{JSON.stringify(diagram, null, 2)}</pre>
          </details>
        </aside>
      </div>
    </main>
  );
}
