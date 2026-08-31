export type PanelStatus = "idle" | "streaming" | "completed" | "error";

/** Immutable snapshot broadcast to every panel when a run is triggered. */
export interface RunCommand {
  runId: number;
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface PanelConfig {
  id: number;
  provider: import("@/lib/eval/types").ProviderId;
  modelId: string;
}

/**
 * The settled (or in-flight) state of one panel, reported up to the arena so
 * the export + latency chart can aggregate across all models.
 */
export interface PanelResult {
  provider: import("@/lib/eval/types").ProviderId;
  modelId: string;
  output: string;
  metrics: import("@/lib/eval/types").EvalMetrics | null;
  clientTTFTMs: number | null;
  error: import("@/lib/eval/types").EvalError | null;
  status: PanelStatus;
}
