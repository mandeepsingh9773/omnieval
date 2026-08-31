import type { ProviderId } from "./types";

/** Curated model catalog shown in the arena's panel selectors and Add Model menu. */
export const MODEL_CATALOG: Record<ProviderId, readonly string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3-mini"],
  anthropic: ["claude-3-7-sonnet", "claude-3-5-haiku", "claude-haiku-4-5"],
  gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
};

export const DEFAULT_MODEL: Record<ProviderId, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-7-sonnet",
  gemini: "gemini-2.5-pro",
  groq: "llama-3.3-70b-versatile",
};

export const MAX_PANELS = 4;

/** Flat, ordered list of every (provider, model) combo for the Add Model menu. */
export const ALL_MODEL_OPTIONS: ReadonlyArray<{
  provider: ProviderId;
  modelId: string;
}> = (["openai", "anthropic", "gemini", "groq"] as const).flatMap((provider) =>
  MODEL_CATALOG[provider].map((modelId) => ({ provider, modelId })),
);
