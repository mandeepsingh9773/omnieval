/**
 * Elo rating math for Arena Mode.
 *
 * Implements the standard Elo update (LMSYS Chatbot Arena style) with a
 * constant K-factor of 32. "Tie" and "Both are bad" both count as a draw
 * for rating purposes (score 0.5 for each side).
 */

export const ELO_K = 32;
export const ELO_START = 1500;

export type VoteResult = "MODEL_A" | "MODEL_B" | "TIE" | "BOTH_BAD";

export const VOTE_RESULTS: readonly VoteResult[] = [
  "MODEL_A",
  "MODEL_B",
  "TIE",
  "BOTH_BAD",
];

/** Expected score for `rating` against `opponentRating`. */
export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

/** Rating change after one matchup, rounded to the nearest integer. */
export function eloDelta(
  rating: number,
  opponentRating: number,
  score: number,
): number {
  return Math.round(ELO_K * (score - expectedScore(rating, opponentRating)));
}

/** Score (1 win / 0.5 draw / 0 loss) for one side of a matchup. */
export function outcomeScore(result: VoteResult, isModelA: boolean): number {
  if (result === "MODEL_A") return isModelA ? 1 : 0;
  if (result === "MODEL_B") return isModelA ? 0 : 1;
  return 0.5;
}

/** Fully-qualified name of the winner, or `null` for TIE/BOTH_BAD. */
export function winnerFor(
  result: VoteResult,
  modelA: string,
  modelB: string,
): string | null {
  if (result === "MODEL_A") return modelA;
  if (result === "MODEL_B") return modelB;
  return null;
}

/** Win/loss/draw increment to apply to a single side. */
export function recordFor(result: VoteResult, isModelA: boolean): {
  wins: number;
  losses: number;
  draws: number;
} {
  if (result === "MODEL_A") return isModelA ? { wins: 1, losses: 0, draws: 0 } : { wins: 0, losses: 1, draws: 0 };
  if (result === "MODEL_B") return isModelA ? { wins: 0, losses: 1, draws: 0 } : { wins: 1, losses: 0, draws: 0 };
  return { wins: 0, losses: 0, draws: 1 };
}
