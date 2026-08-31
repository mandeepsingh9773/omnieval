"use client";

import type { KeyProvider, ValidationResult } from "./types";

/**
 * Client-side key validation. Each check issues a lightweight request
 * directly from the browser to the provider's public API — the key never
 * transits our backend. Some providers do not send CORS headers
 * (e.g. Anthropic), in which case the browser fetch rejects and we report
 * an "error" status instead of a definitive invalid.
 */

const TIMEOUT_MS = 12_000;

interface CheckOptions {
  url: string;
  headers?: Record<string, string>;
  /** True when an HTTP 200 response means the key is valid. */
  expect200?: boolean;
}

async function runCheck(
  provider: KeyProvider,
  options: CheckOptions,
): Promise<ValidationResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(options.url, {
      method: "GET",
      headers: options.headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (options.expect200 !== false && response.status === 200) {
      return { ok: true, status: "valid" };
    }

    const body = await response.text().catch(() => "");
    const message = extractErrorMessage(body, response.status);
    return { ok: false, status: "invalid", message };
  } catch {
    if (controller.signal.aborted) {
      return {
        ok: false,
        status: "error",
        message: "Validation timed out. Check your connection and try again.",
      };
    }
    return {
      ok: false,
      status: "error",
      message:
        "Could not reach the provider from the browser (network or CORS restriction). " +
        "The key was still saved — it will be validated on first use.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractErrorMessage(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
    };
    if (parsed?.error) {
      const message =
        typeof parsed.error === "string" ? parsed.error : parsed.error.message;
      if (message) return message;
    }
  } catch {
    // Body was not JSON — fall through to generic message.
  }
  return `Provider rejected the key (HTTP ${status}).`;
}

function validateOpenAI(key: string): Promise<ValidationResult> {
  return runCheck("openai", {
    url: "https://api.openai.com/v1/models",
    headers: { Authorization: `Bearer ${key}` },
  });
}

function validateAnthropic(key: string): Promise<ValidationResult> {
  return runCheck("anthropic", {
    url: "https://api.anthropic.com/v1/models",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
  });
}

function validateGemini(key: string): Promise<ValidationResult> {
  return runCheck("gemini", {
    url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
  });
}

function validateGroq(key: string): Promise<ValidationResult> {
  return runCheck("groq", {
    url: "https://api.groq.com/openai/v1/models",
    headers: { Authorization: `Bearer ${key}` },
  });
}

export async function validateProviderKey(
  provider: KeyProvider,
  key: string,
): Promise<ValidationResult> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { ok: false, status: "invalid", message: "No key provided." };
  }

  switch (provider) {
    case "openai":
      return validateOpenAI(trimmed);
    case "anthropic":
      return validateAnthropic(trimmed);
    case "gemini":
      return validateGemini(trimmed);
    case "groq":
      return validateGroq(trimmed);
    default:
      return {
        ok: false,
        status: "error",
        message: `Unsupported provider: ${String(provider)}`,
      };
  }
}
