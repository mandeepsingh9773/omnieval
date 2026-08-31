export const PROVIDER_IDS = ["openai", "anthropic", "gemini", "groq"] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

/** Request body accepted by `/api/eval/stream`. */
export interface EvalRequest {
  prompt: string;
  systemPrompt?: string;
  provider: ProviderId;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  /** Client BYOK key. Used only to authenticate against the provider — never persisted. */
  apiKey: string;
  timeoutMs?: number;
}

/** Token usage reported by the provider at the end of a stream. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Performance + cost metrics computed server-side for a single streamed run. */
export interface EvalMetrics {
  provider: ProviderId;
  modelId: string;
  /** ms until the first output token was received from the provider. */
  ttftMs: number | null;
  /** ms from request start until the stream completed. */
  totalLatencyMs: number;
  /** ms spent actually generating (from first token to stream end). */
  generationMs: number | null;
  /** output tokens per second of generation time. */
  tokensPerSecond: number | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Estimated cost in USD. `null` when the model has no known price. */
  estimatedCostUsd: number | null;
  /** False when the model id was not found in the pricing matrix. */
  costKnown: boolean;
  finishReason: string | null;
}

export type EvalErrorCode =
  | "invalid_api_key"
  | "rate_limited"
  | "stream_timeout"
  | "invalid_request"
  | "provider_error"
  | "stream_error";

export interface EvalError {
  code: EvalErrorCode;
  message: string;
  provider?: ProviderId;
  status?: number;
  retryAfterMs?: number | null;
}

/** Wire format for the SSE stream returned by `/api/eval/stream`. */
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "done"; metrics: EvalMetrics }
  | { type: "error"; error: EvalError };
