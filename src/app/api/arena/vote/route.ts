import { NextResponse } from "next/server";
import { z } from "zod";
import { db, Provider } from "@/lib/db";
import { modelKey } from "@/lib/arena/types";
import {
  eloDelta,
  outcomeScore,
  recordFor,
  winnerFor,
} from "@/lib/arena/elo";
import { formatZodError, providerIdSchema } from "@/lib/eval/schemas";
import type { ProviderId } from "@/lib/eval/types";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { cacheDelete } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const voteModelSchema = z.object({
  provider: providerIdSchema,
  modelId: z.string().min(1, "modelId is required").max(256),
});

const voteRunSchema = z.object({
  output: z.string().max(128_000).default(""),
  ttftMs: z.number().int().nonnegative().nullable().optional(),
  totalLatencyMs: z.number().int().nonnegative().nullable().optional(),
  inputTokens: z.number().int().nonnegative().nullable().optional(),
  outputTokens: z.number().int().nonnegative().nullable().optional(),
  estimatedCostUsd: z.number().nonnegative().nullable().optional(),
});

const voteRequestSchema = z
  .object({
    prompt: z.string().min(1, "prompt is required").max(64_000),
    systemPrompt: z.string().max(32_000).nullable().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().max(128_000).optional(),
    result: z.enum(["MODEL_A", "MODEL_B", "TIE", "BOTH_BAD"]),
    modelA: voteModelSchema,
    modelB: voteModelSchema,
    runA: voteRunSchema,
    runB: voteRunSchema,
  })
  .refine(
    (data) =>
      !(
        data.modelA.provider === data.modelB.provider &&
        data.modelA.modelId === data.modelB.modelId
      ),
    { message: "Model A and Model B must be different models.", path: ["modelB"] },
  );

const PROVIDER_ENUM: Record<ProviderId, Provider> = {
  openai: Provider.OPENAI,
  anthropic: Provider.ANTHROPIC,
  gemini: Provider.GEMINI,
  groq: Provider.GROQ,
};

/**
 * POST /api/arena/vote
 *
 * Records a blind A/B arena result: persists the prompt and both model runs,
 * saves the matchup, and applies the standard Elo update (K=32) to the two
 * models' `ModelElo` rows inside a single transaction.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rate = await checkRateLimit(request, {
    namespace: "arena/vote",
    limit: 20,
    window: "1 m",
    message:
      "You are submitting votes too quickly. Votes are rate limited per IP — try again in a moment.",
  });
  if (!rate.success) return rateLimitResponse(rate);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = voteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 },
    );
  }

  const {
    prompt,
    systemPrompt,
    temperature,
    result,
    modelA,
    modelB,
    runA,
    runB,
  } = parsed.data;

  const keyA = modelKey(modelA.provider, modelA.modelId);
  const keyB = modelKey(modelB.provider, modelB.modelId);

  try {
    const outcome = await db.$transaction(async (tx) => {
      const [eloA, eloB] = await Promise.all([
        tx.modelElo.upsert({
          where: { modelName: keyA },
          create: { modelName: keyA },
          update: {},
        }),
        tx.modelElo.upsert({
          where: { modelName: keyB },
          create: { modelName: keyB },
          update: {},
        }),
      ]);

      const scoreA = outcomeScore(result, true);
      const scoreB = outcomeScore(result, false);
      const deltaA = eloDelta(eloA.rating, eloB.rating, scoreA);
      const deltaB = eloDelta(eloB.rating, eloA.rating, scoreB);

      const promptHistory = await tx.promptHistory.create({
        data: {
          prompt,
          systemPrompt: systemPrompt ?? null,
          temperature: temperature ?? 0.7,
        },
      });

      await tx.modelRun.createMany({
        data: [
          {
            promptHistoryId: promptHistory.id,
            provider: PROVIDER_ENUM[modelA.provider],
            modelName: modelA.modelId,
            output: runA.output,
            ttftMs: runA.ttftMs ?? null,
            totalLatencyMs: runA.totalLatencyMs ?? null,
            inputTokens: runA.inputTokens ?? null,
            outputTokens: runA.outputTokens ?? null,
            estimatedCostUsd: runA.estimatedCostUsd ?? null,
          },
          {
            promptHistoryId: promptHistory.id,
            provider: PROVIDER_ENUM[modelB.provider],
            modelName: modelB.modelId,
            output: runB.output,
            ttftMs: runB.ttftMs ?? null,
            totalLatencyMs: runB.totalLatencyMs ?? null,
            inputTokens: runB.inputTokens ?? null,
            outputTokens: runB.outputTokens ?? null,
            estimatedCostUsd: runB.estimatedCostUsd ?? null,
          },
        ],
      });

      const matchup = await tx.arenaMatchup.create({
        data: {
          promptHistoryId: promptHistory.id,
          modelA: keyA,
          modelB: keyB,
          result,
          winnerModel: winnerFor(result, keyA, keyB),
          eloDeltaA: deltaA,
          eloDeltaB: deltaB,
        },
      });

      const recA = recordFor(result, true);
      const recB = recordFor(result, false);

      const [updatedA, updatedB] = await Promise.all([
        tx.modelElo.update({
          where: { modelName: keyA },
          data: {
            rating: eloA.rating + deltaA,
            wins: { increment: recA.wins },
            losses: { increment: recA.losses },
            draws: { increment: recA.draws },
            matchCount: { increment: 1 },
          },
        }),
        tx.modelElo.update({
          where: { modelName: keyB },
          data: {
            rating: eloB.rating + deltaB,
            wins: { increment: recB.wins },
            losses: { increment: recB.losses },
            draws: { increment: recB.draws },
            matchCount: { increment: 1 },
          },
        }),
      ]);

      return { matchup, updatedA, updatedB, deltaA, deltaB };
    });

    // Elo changed — drop the cached leaderboard so the next read is fresh.
    await cacheDelete("arena:leaderboard:v1");

    return NextResponse.json({
      matchupId: outcome.matchup.id,
      result,
      modelA: {
        modelName: keyA,
        provider: modelA.provider,
        modelId: modelA.modelId,
        rating: outcome.updatedA.rating,
        delta: outcome.deltaA,
      },
      modelB: {
        modelName: keyB,
        provider: modelB.provider,
        modelId: modelB.modelId,
        rating: outcome.updatedB.rating,
        delta: outcome.deltaB,
      },
    });
  } catch (error) {
    console.error("[arena/vote] failed to record vote:", error);
    return NextResponse.json(
      { error: "Failed to record the vote. Please try again." },
      { status: 500 },
    );
  }
}
