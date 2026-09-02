"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  EvalError,
  EvalMetrics,
  EvalRequest,
  StreamEvent,
} from "@/lib/eval/types";

export interface UseModelStreamOptions {
  /** Defaults to `/api/eval/stream`. */
  endpoint?: string;
  onText?: (delta: string) => void;
  onDone?: (metrics: EvalMetrics, clientTTFTMs: number | null) => void;
  onError?: (error: EvalError) => void;
}

export interface UseModelStreamResult {
  isStreaming: boolean;
  /** Full accumulated output. */
  text: string;
  /** Server-computed metrics, set once the stream completes. */
  metrics: EvalMetrics | null;
  /** Client-measured time until the first delta was received. */
  clientTTFTMs: number | null;
  error: EvalError | null;
  start: (payload: EvalRequest) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

function normalizeError(raw: unknown, status?: number): EvalError {
  if (raw && typeof raw === "object" && "code" in raw && "message" in raw) {
    const candidate = raw as Partial<EvalError>;
    if (
      typeof candidate.code === "string" &&
      typeof candidate.message === "string"
    ) {
      return {
        code: candidate.code,
        message: candidate.message,
        provider: candidate.provider,
        status: candidate.status ?? status,
        retryAfterMs: candidate.retryAfterMs,
      };
    }
  }
  return {
    code: "stream_error",
    message: status ? `Request failed with HTTP ${status}.` : "Stream failed unexpectedly.",
    status,
  };
}

function parseDataEvent(event: string): StreamEvent | null {
  const dataLines: string[] = [];
  for (const line of event.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;

  for (const line of dataLines) {
    if (line === "[DONE]") continue;
    try {
      return JSON.parse(line) as StreamEvent;
    } catch {
      // Skip malformed lines rather than aborting the whole stream.
    }
  }
  return null;
}

/**
 * Streams a single model eval from `/api/eval/stream` and parses the SSE
 * response. Tracks client-side TTFT in addition to the server metrics.
 */
export function useModelStream(options?: UseModelStreamOptions): UseModelStreamResult {
  const endpoint = options?.endpoint ?? "/api/eval/stream";

  const [isStreaming, setIsStreaming] = useState(false);
  const [text, setText] = useState("");
  const [metrics, setMetrics] = useState<EvalMetrics | null>(null);
  const [clientTTFTMs, setClientTTFTMs] = useState<number | null>(null);
  const [error, setError] = useState<EvalError | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const isActiveRef = useRef(false);

  const onTextRef = useRef(options?.onText);
  const onDoneRef = useRef(options?.onDone);
  const onErrorRef = useRef(options?.onError);

  useEffect(() => {
    onTextRef.current = options?.onText;
    onDoneRef.current = options?.onDone;
    onErrorRef.current = options?.onError;
  }, [options?.onText, options?.onDone, options?.onError]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    isActiveRef.current = false;
    setText("");
    setMetrics(null);
    setClientTTFTMs(null);
    setError(null);
    setIsStreaming(false);
  }, []);

  const start = useCallback(
    async (payload: EvalRequest) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      isActiveRef.current = true;

      setText("");
      setMetrics(null);
      setClientTTFTMs(null);
      setError(null);
      setIsStreaming(true);

      const requestStartedAt = performance.now();
      let localTTFT: number | null = null;
      let output = "";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw normalizeError(body, response.status);
        }
        if (!response.body) {
          throw normalizeError(null, response.status);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const rawEvent of events) {
            const event = parseDataEvent(rawEvent);
            if (!event) continue;

            switch (event.type) {
              case "text": {
                if (localTTFT === null) {
                  localTTFT = Math.round(performance.now() - requestStartedAt);
                  // Real-time: surface TTFT as soon as the first delta lands.
                  setClientTTFTMs(localTTFT);
                }
                output += event.text;
                setText(output);
                onTextRef.current?.(event.text);
                break;
              }
              case "done": {
                setMetrics(event.metrics);
                setClientTTFTMs(localTTFT);
                onDoneRef.current?.(event.metrics, localTTFT);
                break;
              }
              case "error": {
                throw event.error;
              }
            }
          }
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          // User-initiated stop or unmount — not an error.
          return;
        }
        const evalError = normalizeError(caught);
        setError(evalError);
        onErrorRef.current?.(evalError);
      } finally {
        if (isActiveRef.current && abortRef.current === controller) {
          abortRef.current = null;
        }
        isActiveRef.current = false;
        setIsStreaming(false);
      }
    },
    [endpoint],
  );

  // Abort any in-flight stream on unmount.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { isStreaming, text, metrics, clientTTFTMs, error, start, stop, reset };
}
