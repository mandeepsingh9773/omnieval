import type { EvalError, EvalMetrics, ProviderId } from "@/lib/eval/types";

/**
 * One model run captured for export. Mirrors the live state of an arena panel
 * at the moment it settled (completed or errored).
 */
export interface ExportRun {
  panelId: number;
  provider: ProviderId;
  modelId: string;
  output: string;
  /** Server-computed metrics. `null` when the run errored before finishing. */
  metrics: EvalMetrics | null;
  /** Client-measured ms until the first delta was received. */
  clientTTFTMs: number | null;
  /** Stream error, if the run failed. */
  error: EvalError | null;
}

/** Full snapshot of one evaluation session — what gets exported. */
export interface ExportSession {
  /** ISO timestamp of when the session was exported. */
  exportedAt: string;
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  runs: ExportRun[];
}

export type ExportFormat = "json" | "csv" | "markdown";

/** File metadata used to build the downloadable blob. */
export interface ExportFile {
  /** Suggested filename without extension. */
  baseName: string;
  /** Full filename including extension. */
  fileName: string;
  mimeType: string;
  content: string;
}

export const EXPORT_FORMAT_META: Record<
  ExportFormat,
  { label: string; extension: string; mimeType: string }
> = {
  json: { label: "JSON", extension: "json", mimeType: "application/json" },
  csv: { label: "CSV", extension: "csv", mimeType: "text/csv" },
  markdown: { label: "Markdown", extension: "md", mimeType: "text/markdown" },
};
