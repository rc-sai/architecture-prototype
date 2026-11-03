# Catalyst Architecture Builder (prototype)

Drag-and-drop architecture diagrams for Zoho Catalyst, with screen recording and submission.

```bash
npm install
npm run dev        # http://localhost:3000
```

- `/` — editor: drag components from the left palette, connect blocks by dragging between the dots, double-click to rename a block or label an arrow.
- `/submissions` — submitted diagrams; `/submissions/<id>` shows the PNG, recording and diagram JSON.

Shortcuts: `V` select, `H` / hold `Space` pan, `T` add text, `Delete` remove, `⌘Z` / `⌘⇧Z` undo/redo.

## Stack

Next.js 15 (App Router) · Tailwind CSS v4 · React Flow (`@xyflow/react`) canvas · Zustand store with snapshot-based undo/redo ·
`html-to-image` PNG export (pinned to 1.11.11 — newer versions drop edge lines) · `getDisplayMedia` + `MediaRecorder` screen recording · zod validation.

## Where things live

| | |
|---|---|
| `lib/blocks.ts` | Catalyst component catalogue — add a block here |
| `lib/store.ts` | Nodes/edges, undo/redo history, autosave draft |
| `lib/useScreenRecorder.ts` | Screen + mic recording hook |
| `app/api/submissions` | `POST` submission, `GET` list, file streaming with Range support |
| `lib/storage.ts` | Local-disk storage in `data/submissions/` — swap for Catalyst Data Store + Stratus |

Screen recording needs a desktop browser (Chrome, Edge, Firefox, Safari 13+) and asks for permission each time.
