import Link from "next/link";
import { listSubmissions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const submissions = await listSubmissions();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Submissions</h1>
        <Link href="/" className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
          New diagram
        </Link>
      </div>
      {submissions.length === 0 ? (
        <p className="text-sm text-slate-500">No submissions yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link href={`/submissions/${s.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <span>
                  <span className="block text-sm font-medium text-slate-800">{s.participant.name}</span>
                  <span className="block text-xs text-slate-500">
                    {s.diagram.nodes.length} components · {s.diagram.edges.length} connections
                    {s.files.recording ? " · 🎥 recording" : ""}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{new Date(s.receivedAt).toLocaleString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
