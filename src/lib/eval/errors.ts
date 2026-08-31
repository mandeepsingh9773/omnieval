import type { EvalError, EvalErrorCode, ProviderId } from "./types";

export interface ClassifyContext {
  provider: ProviderId;
  /** Set when our own stream timeout signal aborted the request. */
  timeoutAborted: boolean;
  /** Set when the client disconnected (should close quietly, no error event). */
  clientAborted: boolean;
}

interface ErrorLike {
  name?: string;
  message?: string;
  statusCode?: number;
  status?: number;
  retryAfter?: number | string | null;
  responseHeaders?: { get?: (name: string) => string | null };
}

const INVALID_KEY_PATTERN =
  /invalid.{0,12}api.?key|api.?key.{0,12}invalid|unauthorized|authentication failed|incorrect api key|permission denied/i;

function readStatus(err: ErrorLike): number | null {
  const status = err.statusCode ?? err.status;
  return typeof status === "number" ? status : null;
}

function readRetryAfterMs(err: ErrorLike): number | null {
  const header = err.responseHeaders?.get?.("retry-after") ?? err.retryAfter;
  if (typeof header === "number") return Math.max(0, Math.round(header * 1000));
  if (typeof header === "string") {
    const seconds = Number(header);
    if (!Number.isNaN(seconds)) return Math.max(0, Math.round(seconds * 1000));
  }
  return null;
}

/**
 * Map a raw provider/sdk error to a stable, client-friendly EvalError.
 * Returns `null` when the client simply disconnected (nothing to report).
 */
export function classifyProviderError(
  error: unknown,
  context: ClassifyContext,
): EvalError | null {
  if (context.clientAborted) {
    // Client disconnected — close the stream quietly, nothing to report.
    return null;
  }

  if (context.timeoutAborted) {
    return {
      code: "stream_timeout",
      message: "The stream timed out. Try a shorter prompt or a smaller maxTokens.",
    };
  }

  const err = (error ?? {}) as ErrorLike;
  const status = readStatus(err);
  const message = err.message?.trim() || "Unknown provider error.";

  if (status === 401 || status === 403 || INVALID_KEY_PATTERN.test(message)) {
    return {
      code: "invalid_api_key",
      message,
      provider: context.provider,
      status: status ?? undefined,
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      message: "Rate limited by the provider. Please wait and retry.",
      provider: context.provider,
      status: 429,
      retryAfterMs: readRetryAfterMs(err),
    };
  }

  if (status !== null && status >= 400 && status < 500) {
    return {
      code: "provider_error",
      message,
      provider: context.provider,
      status,
    };
  }

  return {
    code: "stream_error",
    message: `Streaming failed: ${message}`,
    provider: context.provider,
    status: status ?? undefined,
  };
}

/** Build the error payload for a request that fails before streaming begins. */
export function requestError(
  code: EvalErrorCode,
  message: string,
  status?: number,
): EvalError {
  return { code, message, status };
}
