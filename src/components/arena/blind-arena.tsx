"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Dices,
  KeyRound,
  Loader2,
  RotateCcw,
  Settings2,
  Sparkles,
  Square,
  Swords,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useKeyVault } from "@/lib/byok/key-vault";
import { KeyVaultDialog } from "@/components/byok/key-vault-dialog";
import { ALL_MODEL_OPTIONS } from "@/lib/eval/models";
import type { EvalMetrics } from "@/lib/eval/types";
import type { ArenaModelRef, ArenaRunReport, VoteResponse } from "@/lib/arena/types";
import type { VoteResult } from "@/lib/arena/elo";
import { useModelStream } from "@/hooks/use-model-stream";
import { Leaderboard } from "./leaderboard";
import { BlindPanel, type PanelHighlight, type RevealInfo } from "./blind-panel";
import { VoteBar } from "./vote-bar";

type Phase = "idle" | "battling" | "ready" | "failed" | "voted";

const inputClass =
  "w-full resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickTwo<T>(items: readonly T[]): [T, T] {
  const shuffled = shuffle(items);
  return [shuffled[0], shuffled[1]];
}

function toRunReport(
  output: string,
  metrics: EvalMetrics | null,
  clientTTFTMs: number | null,
): ArenaRunReport {
  return {
    output,
    ttftMs: metrics?.ttftMs ?? clientTTFTMs ?? null,
    totalLatencyMs: metrics?.totalLatencyMs ?? null,
    inputTokens: metrics?.inputTokens ?? null,
    outputTokens: metrics?.outputTokens ?? null,
    estimatedCostUsd: metrics?.estimatedCostUsd ?? null,
  };
}

function highlightFor(result: VoteResult, isA: boolean): PanelHighlight {
  if (result === "MODEL_A") return isA ? "winner" : "loser";
  if (result === "MODEL_B") return isA ? "loser" : "winner";
  return "draw";
}

export function BlindArena() {
  const { isReady, hasKey, getKey, keys } = useKeyVault();

  const streamA = useModelStream({ endpoint: "/api/eval/stream" });
  const streamB = useModelStream({ endpoint: "/api/eval/stream" });

  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  const [phase, setPhase] = useState<Phase>("idle");
  const [pair, setPair] = useState<{ a: ArenaModelRef; b: ArenaModelRef } | null>(null);
  const [voteState, setVoteState] = useState<"idle" | "submitting">("idle");
  const [voteError, setVoteError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ result: VoteResult; a: RevealInfo; b: RevealInfo } | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const availableModels = useMemo(
    () => ALL_MODEL_OPTIONS.filter((option) => hasKey(option.provider)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keys],
  );

  const notEnoughModels = isReady && availableModels.length < 2;
  const isBattling = phase === "battling";

  // Transition out of the streaming phase once both sides have settled.
  const battleSettled = isBattling && !streamA.isStreaming && !streamB.isStreaming;
  useEffect(() => {
    if (!battleSettled) return;
    if (!streamA.error && !streamB.error) {
      setPhase("ready");
    } else {
      setPhase("failed");
    }
  }, [battleSettled, streamA.error, streamB.error]);

  const startBattle = useCallback(() => {
    if (availableModels.length < 2) return;
    const [a, b] = pickTwo(availableModels);
    setPair({ a, b });
    setReveal(null);
    setVoteError(null);
    setVoteState("idle");
    setPhase("battling");
    streamA.reset();
    streamB.reset();
    void streamA.start({
      prompt,
      systemPrompt: systemPrompt || undefined,
      provider: a.provider,
      modelId: a.modelId,
      temperature,
      maxTokens,
      apiKey: getKey(a.provider),
    });
    void streamB.start({
      prompt,
      systemPrompt: systemPrompt || undefined,
      provider: b.provider,
      modelId: b.modelId,
      temperature,
      maxTokens,
      apiKey: getKey(b.provider),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableModels, prompt, systemPrompt, temperature, maxTokens]);

  const stopBattle = useCallback(() => {
    streamA.stop();
    streamB.stop();
    setPhase("failed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetBattle = useCallback(() => {
    streamA.reset();
    streamB.reset();
    setPair(null);
    setReveal(null);
    setVoteError(null);
    setVoteState("idle");
    setPhase("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVote = useCallback(
    async (result: VoteResult) => {
      if (!pair || voteState === "submitting") return;
      setVoteState("submitting");
      setVoteError(null);
      try {
        const res = await fetch("/api/arena/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            systemPrompt: systemPrompt || null,
            temperature,
            maxTokens,
            result,
            modelA: pair.a,
            modelB: pair.b,
            runA: toRunReport(streamA.text, streamA.metrics, streamA.clientTTFTMs),
            runB: toRunReport(streamB.text, streamB.metrics, streamB.clientTTFTMs),
          }),
        });
        const data = (await res.json().catch(() => null)) as (VoteResponse & {
          error?: string;
        }) | null;
        if (!res.ok || !data?.modelA || !data?.modelB) {
          throw new Error(data?.error ?? `Vote failed with HTTP ${res.status}`);
        }
        setReveal({
          result,
          a: {
            provider: data.modelA.provider,
            modelId: data.modelA.modelId,
            ttftMs: streamA.metrics?.ttftMs ?? streamA.clientTTFTMs ?? null,
            totalLatencyMs: streamA.metrics?.totalLatencyMs ?? null,
            estimatedCostUsd: streamA.metrics?.estimatedCostUsd ?? null,
            inputTokens: streamA.metrics?.inputTokens ?? null,
            outputTokens: streamA.metrics?.outputTokens ?? null,
            rating: data.modelA.rating,
            delta: data.modelA.delta,
          },
          b: {
            provider: data.modelB.provider,
            modelId: data.modelB.modelId,
            ttftMs: streamB.metrics?.ttftMs ?? streamB.clientTTFTMs ?? null,
            totalLatencyMs: streamB.metrics?.totalLatencyMs ?? null,
            estimatedCostUsd: streamB.metrics?.estimatedCostUsd ?? null,
            inputTokens: streamB.metrics?.inputTokens ?? null,
            outputTokens: streamB.metrics?.outputTokens ?? null,
            rating: data.modelB.rating,
            delta: data.modelB.delta,
          },
        });
        setPhase("voted");
        setRefreshKey((n) => n + 1);
      } catch (error) {
        setVoteError(error instanceof Error ? error.message : "Failed to submit vote.");
      } finally {
        setVoteState("idle");
      }
    },
    [pair, prompt, systemPrompt, temperature, maxTokens, voteState, streamA, streamB],
  );

  if (!isReady) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" />
        <p className="text-sm">Unlocking key vault…</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt + controls */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="arena-mode-prompt">Prompt</Label>
            <textarea
              id="arena-mode-prompt"
              value={prompt}
              rows={4}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask the two mystery models anything…"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="arena-mode-system">System prompt (optional)</Label>
            <textarea
              id="arena-mode-system"
              value={systemPrompt}
              rows={4}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="You are a precise, terse assistant."
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Temperature</Label>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={([next]) => setTemperature(next)}
              aria-label="Temperature"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Max tokens</Label>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {maxTokens.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[maxTokens]}
              min={128}
              max={8192}
              step={64}
              onValueChange={([next]) => setMaxTokens(next)}
              aria-label="Max tokens"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={
              notEnoughModels ||
              phase === "battling" ||
              phase === "ready" ||
              prompt.trim().length === 0
            }
            onClick={startBattle}
          >
            <Dices />
            Start blind battle
          </Button>
          {isBattling && (
            <Button size="sm" variant="outline" onClick={stopBattle}>
              <Square />
              Stop
            </Button>
          )}
          {(phase === "ready" || phase === "voted" || phase === "failed") && (
            <Button size="sm" variant="outline" onClick={resetBattle}>
              <RotateCcw />
              New battle
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Swords className="size-3.5" />
            <span>
              Two random models from your configured keys · hidden until you vote
            </span>
          </div>
        </div>
      </div>

      {/* Not enough models warning */}
      {notEnoughModels && (
        <Card className="flex flex-col items-center gap-3 border-dashed p-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <KeyRound className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              Configure at least two provider keys
            </CardTitle>
            <CardDescription className="max-w-md">
              Arena Mode needs at least two models to choose from. Add keys for
              OpenAI, Anthropic, Gemini, or Groq to get started.
            </CardDescription>
          </div>
          <KeyVaultDialog trigger={<Button size="sm"><Settings2 /> Configure API keys</Button>} />
        </Card>
      )}

      {/* Panels */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BlindPanel
          label="Model A"
          content={streamA.text}
          isStreaming={streamA.isStreaming}
          started={pair !== null}
          error={streamA.error}
          revealed={phase === "voted"}
          reveal={reveal?.a ?? null}
          highlight={reveal ? highlightFor(reveal.result, true) : null}
        />
        <BlindPanel
          label="Model B"
          content={streamB.text}
          isStreaming={streamB.isStreaming}
          started={pair !== null}
          error={streamB.error}
          revealed={phase === "voted"}
          reveal={reveal?.b ?? null}
          highlight={reveal ? highlightFor(reveal.result, false) : null}
        />
      </div>

      {/* Vote */}
      {phase === "ready" && (
        <Card className="flex flex-col items-center gap-3 border-dashed p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-muted-foreground" />
            Which response is better?
          </div>
          <VoteBar disabled={voteState === "submitting"} onVote={handleVote} />
          {voteError && (
            <Alert variant="destructive" className="max-w-xl">
              <AlertCircle />
              <AlertTitle>Vote failed</AlertTitle>
              <AlertDescription>{voteError}</AlertDescription>
            </Alert>
          )}
        </Card>
      )}

      {phase === "voted" && reveal && (
        <div className="flex justify-center">
          <p className="text-sm font-medium">
            {reveal.result === "MODEL_A" && "Model A wins this round"}
            {reveal.result === "MODEL_B" && "Model B wins this round"}
            {reveal.result === "TIE" && "It’s a tie"}
            {reveal.result === "BOTH_BAD" && "Both responses were rated bad"}
          </p>
        </div>
      )}

      {phase === "failed" && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Battle aborted</AlertTitle>
          <AlertDescription>
            One or both models failed to respond. Check the panels for details and
            start a new battle.
          </AlertDescription>
        </Alert>
      )}

      {/* Leaderboard */}
      <Leaderboard refreshKey={refreshKey} />
    </div>
  );
}
