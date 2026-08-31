import { KEY_PROVIDERS } from "./types";
import type { KeyProvider, KeyProviderMeta } from "./types";

/**
 * Static metadata for each BYOK provider. Used by the vault dialog and any
 * UI that needs to reference a provider (badges, links, placeholders).
 */
export const PROVIDER_METADATA: Record<KeyProvider, KeyProviderMeta> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    placeholder: "sk-...",
    help: "Find your key under API keys.",
    dashboardUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    placeholder: "sk-ant-...",
    help: "Console > Settings > API keys.",
    dashboardUrl: "https://console.anthropic.com/settings/keys",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    placeholder: "AIza...",
    help: "Google AI Studio > Get API key.",
    dashboardUrl: "https://aistudio.google.com/app/apikey",
  },
  groq: {
    id: "groq",
    label: "Groq",
    placeholder: "gsk_...",
    help: "Console > API Keys.",
    dashboardUrl: "https://console.groq.com/keys",
  },
};

/** Ordered list of providers for rendering tabs and iterating in a stable order. */
export const PROVIDER_LIST: readonly KeyProviderMeta[] = KEY_PROVIDERS.map(
  (id) => PROVIDER_METADATA[id],
);
