import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";
import type { ProviderId } from "./types";

/**
 * Dynamically instantiate the provider model using the *user-supplied* API key.
 *
 * Keys are used in-flight only: each request builds a fresh provider instance,
 * the key is never cached, logged, or persisted server-side, and it dies with
 * the request.
 */
export function createProviderModel(
  provider: ProviderId,
  modelId: string,
  apiKey: string,
): LanguageModel {
  const key = apiKey.trim();
  if (!key) {
    throw new Error("A non-empty API key is required.");
  }

  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: key });
      return openai(modelId);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: key });
      return anthropic(modelId);
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey: key });
      return google(modelId);
    }
    case "groq": {
      const groq = createGroq({ apiKey: key });
      return groq(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${String(provider)}`);
  }
}
