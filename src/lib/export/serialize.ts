import { formatUsd } from "@/lib/eval/pricing";
import type { ExportFile, ExportFormat, ExportSession } from "./types";

/**
 * Serializers that turn an `ExportSession` into JSON, CSV, or a formatted
 * Markdown report. Pure functions — no DOM access — so they are safe to unit
 * test and run in any environment.
 */

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTokensPerSecond(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)} tok/s`;
}

function formatTokens(input: number | null | undefined, output: number | null | undefined): string {
  if (input === null || input === undefined || output === null || output === undefined) {
    return "—";
  }
  return `${input}/${output}`;
}

/** Build the standard, time-stamped file base name for a session export. */
export function buildExportBaseName(session: ExportSession): string {
  const stamp = new Date(session.exportedAt)
    .toISOString()
    .replace(/[:T]/g, "-")
    .slice(0, 19);
  return `omnieval-report-${stamp}`;
}

/** Prepare a complete, downloadable file for the requested format. */
export function serializeSession(session: ExportSession, format: ExportFormat): ExportFile {
  switch (format) {
    case "json":
      return {
        baseName: buildExportBaseName(session),
        fileName: `${buildExportBaseName(session)}.json`,
        mimeType: "application/json",
        content: toJson(session),
      };
    case "csv":
      return {
        baseName: buildExportBaseName(session),
        fileName: `${buildExportBaseName(session)}.csv`,
        mimeType: "text/csv",
        content: toCsv(session),
      };
    case "markdown":
      return {
        baseName: buildExportBaseName(session),
        fileName: `${buildExportBaseName(session)}.md`,
        mimeType: "text/markdown",
        content: toMarkdown(session),
      };
  }
}

export function toJson(session: ExportSession): string {
  return `${JSON.stringify(session, null, 2)}\n`;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function csvEscape(value: unknown): string {
  const string = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(string)) {
    return `"${string.replace(/"/g, '""')}"`;
  }
  return string;
}

const CSV_HEADER = [
  "run",
  "provider",
  "model",
  "ttft_ms",
  "total_latency_ms",
  "generation_ms",
  "tokens_per_second",
  "input_tokens",
  "output_tokens",
  "total_tokens",
  "estimated_cost_usd",
  "cost_known",
  "finish_reason",
  "status",
  "error_code",
  "output",
];

export function toCsv(session: ExportSession): string {
  const lines = [CSV_HEADER.join(",")];

  for (const run of session.runs) {
    const metrics = run.metrics;
    lines.push(
      [
        run.panelId,
        run.provider,
        run.modelId,
        metrics?.ttftMs ?? run.clientTTFTMs ?? null,
        metrics?.totalLatencyMs ?? null,
        metrics?.generationMs ?? null,
        metrics?.tokensPerSecond ?? null,
        metrics?.inputTokens ?? null,
        metrics?.outputTokens ?? null,
        metrics?.totalTokens ?? null,
        metrics?.estimatedCostUsd ?? null,
        metrics?.costKnown ?? false,
        metrics?.finishReason ?? null,
        run.error ? "error" : metrics ? "completed" : "idle",
        run.error?.code ?? null,
        run.output,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------------------
// Markdown report
// ---------------------------------------------------------------------------

function fmtMetric(label: string, value: string): string {
  return `- **${label}:** ${value}`;
}

export function toMarkdown(session: ExportSession): string {
  const exportedAt = new Date(session.exportedAt).toISOString();
  const lines: string[] = [];

  lines.push("# OmniEval Evaluation Report");
  lines.push("");
  lines.push(fmtMetric("Exported", exportedAt));
  lines.push(fmtMetric("Temperature", session.temperature.toFixed(2)));
  lines.push(fmtMetric("Max tokens", session.maxTokens.toLocaleString()));
  lines.push(fmtMetric("Runs", String(session.runs.length)));
  lines.push("");

  lines.push("## Prompt");
  lines.push("");
  lines.push(session.prompt.trim());
  lines.push("");

  if (session.systemPrompt.trim()) {
    lines.push("## System prompt");
    lines.push("");
    lines.push(session.systemPrompt.trim());
    lines.push("");
  }

  lines.push("## Comparison");
  lines.push("");
  lines.push(
    "| Model | TTFT | Latency | Speed | Tokens (in/out) | Cost | Finish |",
  );
  lines.push(
    "|-------|------|---------|-------|-----------------|------|--------|",
  );
  for (const run of session.runs) {
    const metrics = run.metrics;
    const name = `${run.provider}/${run.modelId}`;
    lines.push(
      [
        name,
        formatDuration(metrics?.ttftMs ?? run.clientTTFTMs),
        formatDuration(metrics?.totalLatencyMs),
        formatTokensPerSecond(metrics?.tokensPerSecond),
        formatTokens(metrics?.inputTokens, metrics?.outputTokens),
        formatUsd(metrics?.estimatedCostUsd),
        metrics?.finishReason ?? (run.error ? `error:${run.error.code}` : "—"),
      ].join(" | "),
    );
  }
  lines.push("");

  for (const run of session.runs) {
    lines.push(`## ${run.provider}/${run.modelId}`);
    lines.push("");

    if (run.error) {
      lines.push(`> **Failed:** [${run.error.code}] ${run.error.message}`);
      lines.push("");
    }

    const metrics = run.metrics;
    if (metrics) {
      lines.push("### Metrics");
      lines.push("");
      lines.push(
        fmtMetric("TTFT", formatDuration(metrics.ttftMs ?? run.clientTTFTMs)),
      );
      lines.push(
        fmtMetric("Total latency", formatDuration(metrics.totalLatencyMs)),
      );
      lines.push(
        fmtMetric("Generation time", formatDuration(metrics.generationMs)),
      );
      lines.push(
        fmtMetric("Speed", formatTokensPerSecond(metrics.tokensPerSecond)),
      );
      lines.push(
        fmtMetric(
          "Tokens (in/out/total)",
          `${metrics.inputTokens}/${metrics.outputTokens}/${metrics.totalTokens}`,
        ),
      );
      lines.push(
        fmtMetric("Estimated cost", formatUsd(metrics.estimatedCostUsd)),
      );
      lines.push(fmtMetric("Finish reason", metrics.finishReason ?? "—"));
      lines.push("");
    }

    lines.push("### Output");
    lines.push("");
    lines.push(run.output.trim() || "_No output._");
    lines.push("");
  }

  return lines.join("\n");
}

/** Number of runs that produced usable data (completed or errored). */
export function completedRunCount(session: ExportSession): number {
  return session.runs.filter((run) => run.metrics || run.error).length;
}
