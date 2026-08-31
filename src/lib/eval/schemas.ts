import { z } from "zod";
import { PROVIDER_IDS } from "./types";

export const providerIdSchema = z.enum(PROVIDER_IDS);

/** Strict server-side validation for `/api/eval/stream`. */
export const evalRequestSchema = z.object({
  prompt: z.string().min(1, "prompt is required").max(64_000),
  systemPrompt: z.string().max(32_000).optional(),
  provider: providerIdSchema,
  modelId: z.string().min(1, "modelId is required").max(256),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(128_000).optional(),
  apiKey: z.string().min(1, "apiKey is required").max(512),
  timeoutMs: z.number().int().min(1_000).max(300_000).optional(),
});

export type EvalRequestInput = z.infer<typeof evalRequestSchema>;

/** Extract the first human-readable validation issue. */
export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request payload.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
