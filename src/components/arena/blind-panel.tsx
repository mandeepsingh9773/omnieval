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
import { MetricChip } from "./metric-chip";
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
  winner: "ring-2 ring-status-success/60",
  loser: "ring-1 ring-status-error/40",
  draw: "ring-1 ring-border",
};

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function HighlightLabel({ highlight }: { highlight: PanelHighlight }) {
  if (highlight === "winner") return <Badge variant="success">Winner</Badge>;
  if (highlight === "loser") return <Badge variant="outline" className="text-muted-foreground">Lost</Badge>;
  return <Badge variant="secondary">Draw</Badge>;
}

function EloDeltaChip({ delta, rating }: { delta: number; rating: number }) {
  const positive = delta > 0;
  const zero = delta === 0;
  return (
    <span className="inline-flex shrink-0 items-center overflow-hidden rounded-md border font-mono text-xs tabular-nums">
      <span
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5",
          positive
            ? "bg-status-success/10 text-status-success"
            : zero
              ? "text-muted-foreground"
              : "bg-status-error/10 text-status-error",
        )}
      >
        {positive ? (
          <TrendingUp className="size-3" />
        ) : zero ? (
          <Minus className="size-3" />
        ) : (
          <TrendingDown className="size-3" />
        )}
        <span className={cn(!zero && "font-semibold")}>
          {positive ? "+" : ""}
          {delta}
        </span>
      </span>
      <span className="flex items-center border-l border-border/70 bg-muted/40 px-1.5 py-0.5 text-muted-foreground">
        {rating} elo
      </span>
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">{label}</span>
            {revealed && highlight && <HighlightLabel highlight={highlight} />}
          </div>
          {revealed && reveal ? (
            <div className="flex flex-wrap items-center gap-2">
              <ProviderBadge provider={reveal.provider} />
              <span className="font-mono text-xs font-medium">{reveal.modelId}</span>
              <EloDeltaChip delta={reveal.delta} rating={reveal.rating} />
            </div>
          ) : (
            <Badge variant="outline" className="gap-1.5 border-dashed text-muted-foreground">
              <EyeOff className="size-3" />
              Hidden
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-3">
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
                  <Loader2 className="size-4 animate-spin" />
                  Waiting for first token…
                </div>
                <Skeleton />
              </div>
            ) : started ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                <p>No output produced.</p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <EyeOff className="size-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Hidden until you vote</p>
                  <p className="max-w-56 text-xs text-muted-foreground">
                    Identities and metrics stay concealed to keep the comparison
                    unbiased.
                  </p>
                </div>
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
      </CardContent>

      <div className="shrink-0 border-t border-border/60 px-3 py-2">
        {revealed && reveal ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
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
        ) : hasOutput && !error && !isStreaming ? (
          <p className="flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-muted-foreground">
            <EyeOff className="size-3" />
            Vote to reveal the model and its metrics
          </p>
        ) : (
          <p className="text-center text-[0.7rem] text-muted-foreground">
            Metrics appear after you vote
          </p>
        )}
      </div>
    </Card>
  );
}
