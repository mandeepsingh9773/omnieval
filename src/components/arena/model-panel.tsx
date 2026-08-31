"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  DollarSign,
  FileText,
  Loader2,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useKeyVault } from "@/lib/byok/key-vault";
import { PROVIDER_METADATA } from "@/lib/byok/providers";
import { MODEL_CATALOG } from "@/lib/eval/models";
import { formatUsd } from "@/lib/eval/pricing";
import type { EvalError, ProviderId } from "@/lib/eval/types";
import { useModelStream } from "@/hooks/use-model-stream";
import { Markdown } from "./markdown";
import { PROVIDER_STYLES, ProviderBadge } from "./provider-badge";
import type { PanelResult, PanelStatus, RunCommand } from "./types";

const PROVIDER_IDS: readonly ProviderId[] = ["openai", "anthropic", "gemini", "groq"];

const STATUS_STYLE: Record<PanelStatus, { badge: string; dot: string; label: string }> = {
  idle: {
    badge: "border-border bg-muted/40 text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Idle",
  },
  streaming: {
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500 animate-pulse",
    label: "Streaming",
  },
  completed: {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Completed",
  },
  error: {
    badge: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    label: "Error",
  },
};

function StatusBadge({ status }: { status: PanelStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[0.7rem] font-medium whitespace-nowrap",
        style.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
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

function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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

export interface ModelPanelProps {
  panelId: number;
  provider: ProviderId;
  modelId: string;
  run: RunCommand | null;
  stopSignal: number;
  canRemove: boolean;
  onProviderChange: (panelId: number, provider: ProviderId) => void;
  onModelChange: (panelId: number, modelId: string) => void;
  onRemove: (panelId: number) => void;
  onStatusChange: (panelId: number, status: PanelStatus) => void;
  /** Reports settled/in-flight state up so the arena can build exports + charts. */
  onResult: (panelId: number, result: PanelResult) => void;
}

export function ModelPanel({
  panelId,
  provider,
  modelId,
  run,
  stopSignal,
  canRemove,
  onProviderChange,
  onModelChange,
  onRemove,
  onStatusChange,
  onResult,
}: ModelPanelProps) {
  const { getKey } = useKeyVault();
  const {
    isStreaming,
    text,
    metrics,
    clientTTFTMs,
    error: streamError,
    start,
    stop,
    reset,
  } = useModelStream({ endpoint: "/api/eval/stream" });

  const [localError, setLocalError] = useState<EvalError | null>(null);
  const [copied, setCopied] = useState(false);

  // Keep the latest streaming inputs in a ref so the run effect only fires
  // when a brand-new RunCommand object arrives (not on every render).
  const inputsRef = useRef({ provider, modelId });
  inputsRef.current = { provider, modelId };

  useEffect(() => {
    const { provider: p, modelId: m } = inputsRef.current;
    const apiKey = getKey(p);
    if (!run || !apiKey) {
      if (run && !apiKey) {
        setLocalError({
          code: "invalid_request",
          message: `No ${PROVIDER_METADATA[p].label} key configured. Open API Keys to add one, then run again.`,
        });
      }
      return;
    }
    setLocalError(null);
    void start({
      prompt: run.prompt,
      systemPrompt: run.systemPrompt,
      provider: p,
      modelId: m,
      temperature: run.temperature,
      maxTokens: run.maxTokens,
      apiKey,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSignal]);

  const error = streamError ?? localError;
  const status: PanelStatus = error
    ? "error"
    : isStreaming
      ? "streaming"
      : text || metrics
        ? "completed"
        : "idle";

  useEffect(() => {
    onStatusChange(panelId, status);
  }, [panelId, status, onStatusChange]);

  // Surface panel state to the arena on status transitions only — never on
  // every streamed delta — so exports and the chart stay current without
  // re-rendering the whole grid per token.
  const lastResultStatusRef = useRef<PanelStatus>("idle");
  useEffect(() => {
    if (status === lastResultStatusRef.current) return;
    lastResultStatusRef.current = status;
    onResult(panelId, {
      provider,
      modelId,
      output: text,
      metrics,
      clientTTFTMs,
      error,
      status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handleProviderChange(next: ProviderId) {
    reset();
    setLocalError(null);
    onProviderChange(panelId, next);
  }

  function handleModelChange(next: string) {
    reset();
    setLocalError(null);
    onModelChange(panelId, next);
  }

  function handleRemove() {
    reset();
    setLocalError(null);
    onRemove(panelId);
  }

  async function copyOutput() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  const liveTTFT = clientTTFTMs;
  const showMetrics = Boolean(metrics) || liveTTFT !== null;
  const displayTTFT = metrics?.ttftMs ?? liveTTFT;

  const providerStyle = PROVIDER_STYLES[provider];

  return (
    <Card className="flex h-[30rem] flex-col overflow-hidden xl:h-[32rem]">
      <CardHeader className="shrink-0 gap-2 border-b p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as ProviderId)}
            aria-label="Provider"
            className={cn(
              "h-5 max-w-28 cursor-pointer appearance-none rounded-md border px-1.5 text-[0.7rem] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              providerStyle.badge,
            )}
          >
            {PROVIDER_IDS.map((id) => (
              <option key={id} value={id}>
                {PROVIDER_METADATA[id].label}
              </option>
            ))}
          </select>

          <Select value={modelId} onValueChange={handleModelChange}>
            <SelectTrigger size="sm" className="h-7 min-w-0 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_CATALOG[provider].map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={copied ? "Copied" : "Copy output"}
            disabled={!text}
            onClick={copyOutput}
          >
            {copied ? <Check className="text-emerald-500" /> : <Copy />}
          </Button>
          {canRemove && (
            <Button size="icon-sm" variant="ghost" aria-label="Remove panel" onClick={handleRemove}>
              <X />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <ProviderBadge provider={provider} />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {status === "error" ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Run failed</AlertTitle>
              <AlertDescription>
                [{error?.code ?? "unknown"}] {error?.message ?? "Unknown error"}
              </AlertDescription>
            </Alert>
          ) : !text ? (
            status === "streaming" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" />
                  Waiting for first token…
                </div>
                <Skeleton />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Zap className="size-6 opacity-40" />
                <p>Ready. Set a prompt and press Run to benchmark this model.</p>
              </div>
            )
          ) : (
            <div className="relative">
              <Markdown content={text} />
              {isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary align-text-bottom" />
              )}
            </div>
          )}
        </div>

        <div className="shrink-0">
          {showMetrics ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              <MetricChip icon={Timer} label="TTFT" value={formatDuration(displayTTFT)} />
              <MetricChip
                icon={Zap}
                label="Speed"
                value={
                  metrics?.tokensPerSecond !== null &&
                  metrics?.tokensPerSecond !== undefined
                    ? `${metrics.tokensPerSecond.toFixed(1)} tok/s`
                    : isStreaming
                      ? "…"
                      : "—"
                }
              />
              <MetricChip
                icon={Clock}
                label="Total"
                value={formatDuration(metrics?.totalLatencyMs)}
              />
              <MetricChip
                icon={FileText}
                label="Tokens"
                value={
                  metrics
                    ? `${metrics.inputTokens}/${metrics.outputTokens}`
                    : isStreaming
                      ? "…"
                      : "—"
                }
              />
              <MetricChip
                icon={DollarSign}
                label="Cost"
                value={
                  metrics
                    ? formatUsd(metrics.estimatedCostUsd)
                    : isStreaming
                      ? "…"
                      : "—"
                }
              />
              <MetricChip
                icon={Clock}
                label="Reason"
                value={metrics?.finishReason ?? "—"}
              />
            </div>
          ) : (
            <p className="text-center text-[0.7rem] text-muted-foreground">
              Metrics appear once streaming starts
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
