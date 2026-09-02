import { streamText } from "ai";
import { NextResponse } from "next/server";
import { classifyProviderError, requestError } from "@/lib/eval/errors";
import { calculateCost } from "@/lib/eval/pricing";
import { createProviderModel } from "@/lib/eval/providers";
import { evalRequestSchema, formatZodError } from "@/lib/eval/schemas";
import { checkRateLimit, rateLimitEvalResponse } from "@/lib/ratelimit";
import type { EvalError, EvalMetrics, StreamEvent } from "@/lib/eval/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const DEFAULT_TIMEOUT_MS = 60_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 300_000;

const encoder = new TextEncoder();

function sse(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function jsonError(
  status: number,
  code: EvalError["code"],
  message: string,
): NextResponse {
  return NextResponse.json(requestError(code, message, status), { status });
}

function clampTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(value, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

/**
 * POST /api/eval/stream
 *
 * Streams a single provider completion using a client-supplied BYOK key.
 * Responds with a `text/event-stream` sequence:
 *
 *   data: {"type":"text","text":"<delta>"}
 *   data: {"type":"done","metrics":{...}}
 *   data: {"type":"error","error":{code,message,...}}   (on failure)
 *
 * The API key is used in-flight only — never persisted, never logged.
 */
export async function POST(request: Request): Promise<Response> {
  const rate = await checkRateLimit(request, {
    namespace: "eval/stream",
    limit: 30,
    window: "1 m",
    message:
      "Too many benchmark runs from this IP. Streaming is rate limited to protect shared infrastructure — try again shortly.",
  });
  if (!rate.success) return rateLimitEvalResponse(rate);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_request", "Request body must be valid JSON.");
  }

  const parsed = evalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "invalid_request", formatZodError(parsed.error));
  }

  const {
    prompt,
    systemPrompt,
    provider,
    modelId,
    temperature,
    maxTokens,
    apiKey,
    timeoutMs,
  } = parsed.data;

  let model;
  try {
    model = createProviderModel(provider, modelId, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid provider configuration.";
    return jsonError(400, "provider_error", message);
  }

  const timeout = clampTimeout(timeoutMs);
  const timeoutSignal = AbortSignal.timeout(timeout);
  const abortSignal = AbortSignal.any([request.signal, timeoutSignal]);

  const startedAt = performance.now();
  let firstChunkAt: number | null = null;

  const result = streamText({
    model,
    system: systemPrompt,
    prompt,
    temperature,
    maxOutputTokens: maxTokens,
    abortSignal,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let finishedAt = performance.now();

      try {
        for await (const part of result.stream) {
          if (part.type === "text-delta") {
            if (firstChunkAt === null) {
              firstChunkAt = performance.now();
            }
            controller.enqueue(encoder.encode(sse({ type: "text", text: part.text })));
          } else if (part.type === "error") {
            // Provider/sdk errors surface as stream parts in AI SDK v7.
            throw part.error;
          }
        }
        finishedAt = performance.now();

        const [usage, finishReason] = await Promise.all([
          Promise.resolve(result.usage).catch(() => null),
          Promise.resolve(result.finishReason).catch(() => null),
        ]);

        const inputTokens = usage?.inputTokens ?? 0;
        const outputTokens = usage?.outputTokens ?? 0;
        const ttftMs =
          firstChunkAt !== null ? Math.round(Math.max(0, firstChunkAt - startedAt)) : null;
        const generationMs =
          ttftMs !== null ? Math.max(0, finishedAt - firstChunkAt!) : null;
        const tokensPerSecond =
          generationMs !== null && generationMs > 0
            ? (outputTokens / generationMs) * 1000
            : null;

        const { usd, known } = calculateCost(modelId, inputTokens, outputTokens);

        const metrics: EvalMetrics = {
          provider,
          modelId,
          ttftMs,
          totalLatencyMs: Math.round(Math.max(0, finishedAt - startedAt)),
          generationMs,
          tokensPerSecond,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCostUsd: usd,
          costKnown: known,
          finishReason,
        };

        controller.enqueue(encoder.encode(sse({ type: "done", metrics })));
        controller.close();
      } catch (error) {
        const evalError = classifyProviderError(error, {
          provider,
          timeoutAborted: timeoutSignal.aborted,
          clientAborted: request.signal.aborted,
        });
        if (evalError) {
          try {
            controller.enqueue(encoder.encode(sse({ type: "error", error: evalError })));
          } catch {
            // Controller may already be closed — ignore.
          }
        }
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
