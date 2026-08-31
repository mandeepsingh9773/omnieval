"use client";

import {
  AlertCircle,
  Clock,
  DollarSign,
  EyeOff,
  FileText,
  Loader2,
  Minus,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/eval/pricing";
import type { EvalError, ProviderId } from "@/lib/eval/types";
import { Markdown } from "./markdown";
import { ProviderBadge } from "./provider-badge";

/** What gets shown once a side is revealed after voting. */
export interface RevealInfo {
  provider: ProviderId;
  modelId: string;
  ttftMs: number | null;
  totalLatencyMs: number | null;
  estimatedCostUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  rating: number;
  delta: number;
}

export type PanelHighlight = "winner" | "loser" | "draw";

interface BlindPanelProps {
  label: string;
  content: string;
  isStreaming: boolean;
  /** True once a battle has been started for this side. */
  started: boolean;
  error: EvalError | null;
  revealed: boolean;
  reveal: RevealInfo | null;
  highlight: PanelHighlight | null;
}

const HIGHLIGHT_RING: Record<PanelHighlight, string> = {
  winner: "ring-2 ring-emerald-500/60",
  loser: "ring-1 ring-destructive/40",
  draw: "ring-1 ring-border",
};

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function MetricChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-[0.65rem] font-medium text-muted-foreground uppercase">
        {label}
      </span>
      <span className="truncate font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}

function EloDeltaChip({ delta, rating }: { delta: number; rating: number }) {
  const positive = delta > 0;
  const zero = delta === 0;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums",
        positive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : zero
            ? "border-border bg-muted/40 text-muted-foreground"
            : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {positive ? (
        <TrendingUp className="size-3" />
      ) : zero ? (
        <Minus className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {positive ? "+" : ""}
      {delta} · {rating} elo
    </span>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-muted" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function BlindPanel({
  label,
  content,
  isStreaming,
  started,
  error,
  revealed,
  reveal,
  highlight,
}: BlindPanelProps) {
  const hasOutput = content.length > 0;

  return (
    <Card
      className={cn(
        "flex h-[30rem] flex-col overflow-hidden xl:h-[32rem]",
        revealed ? HIGHLIGHT_RING[highlight ?? "draw"] : "",
      )}
    >
      <CardHeader className="shrink-0 gap-2 border-b p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight">{label}</span>
          {revealed && reveal ? (
            <div className="flex flex-wrap items-center gap-2">
              <ProviderBadge provider={reveal.provider} />
              <span className="font-mono text-xs font-medium">{reveal.modelId}</span>
              <EloDeltaChip delta={reveal.delta} rating={reveal.rating} />
            </div>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <EyeOff className="size-3" />
              Hidden
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Run failed</AlertTitle>
              <AlertDescription>
                [{error.code}] {error.message}
              </AlertDescription>
            </Alert>
          ) : !hasOutput ? (
            isStreaming ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" />
                  Waiting for first token…
                </div>
                <Skeleton />
              </div>
            ) : started ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                <p>No output produced.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <EyeOff className="size-6 opacity-40" />
                <p>Identity and metrics stay hidden until you vote.</p>
              </div>
            )
          ) : (
            <div className="relative">
              <Markdown content={content} />
              {isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {revealed && reveal ? (
          <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4">
            <MetricChip icon={Timer} label="TTFT" value={formatDuration(reveal.ttftMs)} />
            <MetricChip
              icon={Clock}
              label="Latency"
              value={formatDuration(reveal.totalLatencyMs)}
            />
            <MetricChip
              icon={DollarSign}
              label="Cost"
              value={formatUsd(reveal.estimatedCostUsd)}
            />
            <MetricChip
              icon={FileText}
              label="Tokens"
              value={
                reveal.inputTokens !== null && reveal.outputTokens !== null
                  ? `${reveal.inputTokens}/${reveal.outputTokens}`
                  : "—"
              }
            />
          </div>
        ) : hasOutput && !error ? (
          <p className="shrink-0 text-center text-[0.7rem] text-muted-foreground">
            Vote to reveal the model and its metrics
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
