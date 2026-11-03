import {
  Archive,
  Braces,
  Clock,
  Cpu,
  Database,
  Globe,
  Network,
  Plug,
  SquareFunction,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type BlockKind =
  | "slate"
  | "basicio"
  | "advancedio"
  | "integration"
  | "cron"
  | "datastore"
  | "nosql"
  | "cache"
  | "stratus"
  | "apigateway";

export type BlockCategory = "Hosting" | "Serverless" | "Data & Storage" | "Network";

export interface BlockDef {
  kind: BlockKind;
  label: string;
  description: string;
  category: BlockCategory;
  icon: LucideIcon;
  color: string;
}

export const BLOCKS: BlockDef[] = [
  { kind: "slate", label: "Slate", description: "Frontend hosting", category: "Hosting", icon: Globe, color: "#2563eb" },
  { kind: "basicio", label: "Basic I/O Function", description: "Simple request/response", category: "Serverless", icon: SquareFunction, color: "#7c3aed" },
  { kind: "advancedio", label: "Advanced I/O Function", description: "Full HTTP control", category: "Serverless", icon: Cpu, color: "#9333ea" },
  { kind: "integration", label: "Integration Function", description: "Zoho service integrations", category: "Serverless", icon: Plug, color: "#c026d3" },
  { kind: "cron", label: "Cron Job", description: "Scheduled execution", category: "Serverless", icon: Clock, color: "#ea580c" },
  { kind: "datastore", label: "Data Store", description: "Relational database", category: "Data & Storage", icon: Database, color: "#059669" },
  { kind: "nosql", label: "NoSQL", description: "Document database", category: "Data & Storage", icon: Braces, color: "#0d9488" },
  { kind: "cache", label: "Cache", description: "Key-value cache", category: "Data & Storage", icon: Zap, color: "#d97706" },
  { kind: "stratus", label: "Stratus Bucket", description: "Object storage", category: "Data & Storage", icon: Archive, color: "#0891b2" },
  { kind: "apigateway", label: "API Gateway", description: "Routing, auth & throttling", category: "Network", icon: Network, color: "#dc2626" },
];

export const BLOCKS_BY_KIND = Object.fromEntries(BLOCKS.map((b) => [b.kind, b])) as Record<BlockKind, BlockDef>;

export const BLOCK_DRAG_MIME = "application/catalyst-block";

export function isBlockKind(value: string): value is BlockKind {
  return value in BLOCKS_BY_KIND;
}
