"use client";

import { cn } from "@/lib/utils";
import type { ProviderId } from "@/lib/eval/types";

interface ProviderStyle {
  label: string;
  /** Classes for the small colored badge. Static strings so Tailwind can scan them. */
  badge: string;
  dot: string;
}

export const PROVIDER_STYLES: Record<ProviderId, ProviderStyle> = {
  openai: {
    label: "OpenAI",
    badge:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  anthropic: {
    label: "Anthropic",
    badge:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  gemini: {
    label: "Gemini",
    badge:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  groq: {
    label: "Groq",
    badge:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
};

export function ProviderBadge({ provider }: { provider: ProviderId }) {
  const style = PROVIDER_STYLES[provider];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap",
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
