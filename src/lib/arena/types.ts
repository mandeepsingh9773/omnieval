import { PROVIDER_IDS, type ProviderId } from "@/lib/eval/types";

/** Fully-qualified model identity persisted in `ModelElo`/`ArenaMatchup`. */
export function modelKey(provider: ProviderId, modelId: string): string {
  return `${provider}/${modelId}`;
}

export interface ParsedModelKey {
  provider: ProviderId | null;
  modelId: string;
}

/** Split a `provider/modelId` key back into parts. */
export function parseModelKey(key: string): ParsedModelKey {
  const slash = key.indexOf("/");
  if (slash === -1) return { provider: null, modelId: key };
  const provider = key.slice(0, slash) as ProviderId;
  return {
    provider: PROVIDER_IDS.includes(provider) ? provider : null,
    modelId: key.slice(slash + 1),
  };
}

/** Client payload describing one side of a matchup. */
export interface ArenaModelRef {
  provider: ProviderId;
  modelId: string;
}

/** Run metrics a single side reports back when voting. */
export interface ArenaRunReport {
  output: string;
  ttftMs: number | null;
  totalLatencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
}

/** Response shape of `POST /api/arena/vote`. */
export interface VoteResponseModel {
  modelName: string;
  provider: ProviderId;
  modelId: string;
  rating: number;
  delta: number;
}

export interface VoteResponse {
  matchupId: string;
  result: import("./elo").VoteResult;
  modelA: VoteResponseModel;
  modelB: VoteResponseModel;
}

/** Response shape of `GET /api/arena/leaderboard`. */
export interface LeaderboardEntry {
  modelName: string;
  provider: ProviderId | null;
  modelId: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matchCount: number;
  winRate: number;
}
