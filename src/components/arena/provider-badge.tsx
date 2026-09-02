"use client";

import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/eval/types";

interface ProviderStyle {
  label: string;
  /** Classes for the small colored badge. Static strings so Tailwind can scan them. */
  badge: string;
  /** Classes for a provider-tinted select trigger (includes dark-mode overrides). */
  trigger: string;
  dot: string;
}

/** Single source of truth for provider color identity. Theme-aware via tokens. */
export const PROVIDER_STYLES: Record<ProviderId, ProviderStyle> = {
  openai: {
    label: "OpenAI",
    badge: "border-provider-openai/30 bg-provider-openai/10 text-provider-openai",
    trigger:
      "border-provider-openai/30 bg-provider-openai/10 text-provider-openai dark:bg-provider-openai/15 dark:hover:bg-provider-openai/25",
    dot: "bg-provider-openai",
  },
  anthropic: {
    label: "Anthropic",
    badge:
      "border-provider-anthropic/30 bg-provider-anthropic/10 text-provider-anthropic",
    trigger:
      "border-provider-anthropic/30 bg-provider-anthropic/10 text-provider-anthropic dark:bg-provider-anthropic/15 dark:hover:bg-provider-anthropic/25",
    dot: "bg-provider-anthropic",
  },
  gemini: {
    label: "Gemini",
    badge: "border-provider-gemini/30 bg-provider-gemini/10 text-provider-gemini",
    trigger:
      "border-provider-gemini/30 bg-provider-gemini/10 text-provider-gemini dark:bg-provider-gemini/15 dark:hover:bg-provider-gemini/25",
    dot: "bg-provider-gemini",
  },
  groq: {
    label: "Groq",
    badge: "border-provider-groq/30 bg-provider-groq/10 text-provider-groq",
    trigger:
      "border-provider-groq/30 bg-provider-groq/10 text-provider-groq dark:bg-provider-groq/15 dark:hover:bg-provider-groq/25",
    dot: "bg-provider-groq",
  },
};

export function ProviderBadge({ provider }: { provider: ProviderId }) {
  const style = PROVIDER_STYLES[provider];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        style.badge,
      )}
    >
      {style.label}
    </span>
  );
}

export function ProviderDot({ provider }: { provider: ProviderId }) {
  const style = PROVIDER_STYLES[provider];
  return <span className={cn("size-2 rounded-full", style.dot)} />;
}
