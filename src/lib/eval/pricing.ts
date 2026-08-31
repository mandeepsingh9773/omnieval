/**
 * Static pricing matrix for popular models.
 *
 * Prices are USD per 1M tokens, list price at time of writing. They change
 * frequently — keep this table current and treat it as an *estimate*.
 * Unknown models resolve to `costKnown: false` and a `null` cost rather than
 * a wrong guess.
 */
export interface ModelPrice {
  inputUsdPer1M: number;
  outputUsdPer1M: number;
}

const MODEL_PRICING: Record<string, ModelPrice> = {
  // ---- OpenAI ----
  "gpt-4o": { inputUsdPer1M: 2.5, outputUsdPer1M: 10 },
  "gpt-4o-mini": { inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  "gpt-4.1": { inputUsdPer1M: 2, outputUsdPer1M: 8 },
  "gpt-4.1-mini": { inputUsdPer1M: 0.4, outputUsdPer1M: 1.6 },
  "gpt-4.1-nano": { inputUsdPer1M: 0.1, outputUsdPer1M: 0.4 },
  "gpt-4-turbo": { inputUsdPer1M: 10, outputUsdPer1M: 30 },
  "gpt-3.5-turbo": { inputUsdPer1M: 0.5, outputUsdPer1M: 1.5 },
  o1: { inputUsdPer1M: 15, outputUsdPer1M: 60 },
  "o1-mini": { inputUsdPer1M: 1.1, outputUsdPer1M: 4.4 },
  o3: { inputUsdPer1M: 2, outputUsdPer1M: 8 },
  "o3-mini": { inputUsdPer1M: 1.1, outputUsdPer1M: 4.4 },
  "o4-mini": { inputUsdPer1M: 1.1, outputUsdPer1M: 4.4 },

  // ---- Anthropic ----
  "claude-3-opus": { inputUsdPer1M: 15, outputUsdPer1M: 75 },
  "claude-3-7-sonnet": { inputUsdPer1M: 3, outputUsdPer1M: 15 },
  "claude-3-5-sonnet": { inputUsdPer1M: 3, outputUsdPer1M: 15 },
  "claude-sonnet-4": { inputUsdPer1M: 3, outputUsdPer1M: 15 },
  "claude-3-sonnet": { inputUsdPer1M: 3, outputUsdPer1M: 15 },
  "claude-3-5-haiku": { inputUsdPer1M: 0.8, outputUsdPer1M: 4 },
  "claude-3-haiku": { inputUsdPer1M: 0.25, outputUsdPer1M: 1.25 },
  "claude-haiku-4-5": { inputUsdPer1M: 1, outputUsdPer1M: 5 },
  "claude-opus-4": { inputUsdPer1M: 15, outputUsdPer1M: 75 },

  // ---- Google Gemini ----
  "gemini-2.5-pro": { inputUsdPer1M: 1.25, outputUsdPer1M: 10 },
  "gemini-2.5-flash": { inputUsdPer1M: 0.3, outputUsdPer1M: 2.5 },
  "gemini-2.5-flash-lite": { inputUsdPer1M: 0.1, outputUsdPer1M: 0.4 },
  "gemini-2.0-flash": { inputUsdPer1M: 0.1, outputUsdPer1M: 0.4 },
  "gemini-2.0-flash-lite": { inputUsdPer1M: 0.075, outputUsdPer1M: 0.3 },
  "gemini-1.5-pro": { inputUsdPer1M: 1.25, outputUsdPer1M: 5 },
  "gemini-1.5-flash": { inputUsdPer1M: 0.075, outputUsdPer1M: 0.3 },

  // ---- Groq ----
  "llama-3.3-70b-versatile": { inputUsdPer1M: 0.59, outputUsdPer1M: 0.79 },
  "llama-3.1-8b-instant": { inputUsdPer1M: 0.05, outputUsdPer1M: 0.08 },
  "llama-3.2-90b-text-preview": { inputUsdPer1M: 0.89, outputUsdPer1M: 0.89 },
  "llama-3.2-3b-preview": { inputUsdPer1M: 0.06, outputUsdPer1M: 0.06 },
  "mixtral-8x7b-32768": { inputUsdPer1M: 0.24, outputUsdPer1M: 0.24 },
  "gemma2-9b-it": { inputUsdPer1M: 0.2, outputUsdPer1M: 0.2 },
  "qwen-qwq-32b": { inputUsdPer1M: 0.15, outputUsdPer1M: 0.18 },
};

/**
 * Resolve a model id (which may carry version/date suffixes) to a price.
 * Longest-prefix match wins so `gpt-4o-mini` never matches `gpt-4o`.
 */
export function getModelPrice(modelId: string): ModelPrice | null {
  const normalized = modelId.toLowerCase().trim();
  let best: { key: string; price: ModelPrice } | null = null;

  for (const [key, price] of Object.entries(MODEL_PRICING)) {
    const matches = normalized === key || normalized.startsWith(`${key}-`);
    if (matches && (!best || key.length > best.key.length)) {
      best = { key, price };
    }
  }

  return best?.price ?? null;
}

export interface CostResult {
  /** USD estimate. `null` when the model is not in the matrix. */
  usd: number | null;
  known: boolean;
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): CostResult {
  const price = getModelPrice(modelId);
  if (!price) return { usd: null, known: false };

  const usd =
    (inputTokens / 1_000_000) * price.inputUsdPer1M +
    (outputTokens / 1_000_000) * price.outputUsdPer1M;

  return { usd, known: true };
}

/** Format for display, e.g. `$0.000037`. */
export function formatUsd(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "unknown";
  if (usd === 0) return "$0.00";
  if (usd < 0.0001) return `$${usd.toFixed(8)}`;
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}
