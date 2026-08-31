export const KEY_PROVIDERS = ["openai", "anthropic", "gemini", "groq"] as const;

export type KeyProvider = (typeof KEY_PROVIDERS)[number];

export interface KeyProviderMeta {
  id: KeyProvider;
  label: string;
  placeholder: string;
  help: string;
  dashboardUrl: string;
}

export type KeyVaultState = Record<KeyProvider, string>;

export type ValidationStatus =
  | "idle"
  | "validating"
  | "valid"
  | "invalid"
  | "error";

export interface ValidationResult {
  ok: boolean;
  status: Exclude<ValidationStatus, "idle" | "validating">;
  message?: string;
}
