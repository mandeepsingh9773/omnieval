import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseModelKey } from "@/lib/arena/types";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitResponse,
} from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** How long the aggregated leaderboard is served from Redis before a refresh. */
const LEADERBOARD_TTL_SECONDS = 30;
const LEADERBOARD_CACHE_KEY = "arena:leaderboard:v1";

interface LeaderboardModel {
  modelName: string;
  provider: string | null;
  modelId: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matchCount: number;
  winRate: number;
}

/**
 * GET /api/arena/leaderboard
 *
 * Returns every tracked model ranked by current Elo score, with win/loss/draw
 * records, total battles, and win rate. Per-IP rate limited, and the result is
 * cached in Redis for `LEADERBOARD_TTL_SECONDS` to keep read-heavy polling off
 * the database.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const rate = await checkRateLimit(request, {
    namespace: "arena/leaderboard",
    limit: 120,
    window: "1 m",
  });
  if (!rate.success) return rateLimitResponse(rate);
  const rateHeaders = rateLimitHeaders(rate);

  try {
    const cached = await cacheGet<LeaderboardModel[]>(LEADERBOARD_CACHE_KEY);
    if (cached) {
      return NextResponse.json(
        { models: cached, cached: true },
        { headers: rateHeaders },
      );
    }

    const rows = await db.modelElo.findMany({
      orderBy: [
        { rating: "desc" },
        { matchCount: "desc" },
        { updatedAt: "desc" },
      ],
    });

    const models: LeaderboardModel[] = rows.map((row) => {
      const { provider, modelId } = parseModelKey(row.modelName);
      return {
        modelName: row.modelName,
        provider,
        modelId,
        rating: row.rating,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        matchCount: row.matchCount,
        winRate: row.matchCount > 0 ? row.wins / row.matchCount : 0,
      };
    });

    // Populate the cache before responding; a slow write must not block the reply.
    await cacheSet(LEADERBOARD_CACHE_KEY, models, LEADERBOARD_TTL_SECONDS);

    return NextResponse.json(
      { models, cached: false },
      { headers: rateHeaders },
    );
  } catch (error) {
    console.error("[arena/leaderboard] failed to load:", error);
    return NextResponse.json(
      { error: "Failed to load the leaderboard." },
      { status: 500 },
    );
  }
}
