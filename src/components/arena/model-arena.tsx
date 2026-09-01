"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BarChart3, KeyRound, Loader2, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { KeyVaultDialog } from "@/components/byok/key-vault-dialog";
import { useKeyVault } from "@/lib/byok/key-vault";
import { KEY_PROVIDERS } from "@/lib/byok/types";
import { ALL_MODEL_OPTIONS, DEFAULT_MODEL, MAX_PANELS } from "@/lib/eval/models";
import type { ProviderId } from "@/lib/eval/types";
import type { ExportRun, ExportSession } from "@/lib/export/types";
import { ControlBar, type AddableModel } from "./control-bar";
import { ModelPanel } from "./model-panel";
import { ExportMenu } from "./export-menu";
import { LatencyChart } from "./latency-chart";
import type { PanelConfig, PanelResult, PanelStatus, RunCommand } from "./types";

function gridClass(count: number): string {
  if (count === 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 lg:grid-cols-2";
  if (count === 3) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
}

export function ModelArena() {
  const { isReady, hasKey } = useKeyVault();

  const nextIdRef = useRef(2);
  const [panels, setPanels] = useState<PanelConfig[]>([
    { id: 1, provider: "openai", modelId: DEFAULT_MODEL.openai },
  ]);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [run, setRun] = useState<RunCommand | null>(null);
  const [stopSignal, setStopSignal] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<number, PanelStatus>>({});
  const [results, setResults] = useState<Record<number, PanelResult>>({});

  const anyStreaming = useMemo(
    () => Object.values(statusMap).some((status) => status === "streaming"),
    [statusMap],
  );

  const canRun = !anyStreaming && prompt.trim().length > 0;

  // Aggregate settled panel results into an exportable session snapshot.
  const session = useMemo<ExportSession>(() => {
    const runs: ExportRun[] = Object.entries(results)
      .filter(
        ([, result]) => result.status === "completed" || result.status === "error",
      )
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([panelId, result]) => ({
        panelId: Number(panelId),
        provider: result.provider,
        modelId: result.modelId,
        output: result.output,
        metrics: result.metrics,
        clientTTFTMs: result.clientTTFTMs,
        error: result.error,
      }));
    return {
      exportedAt: new Date().toISOString(),
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
      runs,
    };
  }, [results, prompt, systemPrompt, temperature, maxTokens]);

  const hasResults = session.runs.length > 0;

  const addableOptions = useMemo<AddableModel[]>(() => {
    const present = new Set(panels.map((p) => `${p.provider}:${p.modelId}`));
    return ALL_MODEL_OPTIONS.filter(
      (option) => !present.has(`${option.provider}:${option.modelId}`),
    );
  }, [panels]);

  const noKeysConfigured = useMemo(
    () => isReady && KEY_PROVIDERS.every((provider) => !hasKey(provider)),
    [isReady, hasKey],
  );

  const handleStatusChange = useCallback((panelId: number, status: PanelStatus) => {
    setStatusMap((prev) => (prev[panelId] === status ? prev : { ...prev, [panelId]: status }));
  }, []);

  const handleResult = useCallback((panelId: number, result: PanelResult) => {
    setResults((prev) =>
      prev[panelId]?.status === result.status ? prev : { ...prev, [panelId]: result },
    );
  }, []);

  const handleProviderChange = useCallback((panelId: number, provider: ProviderId) => {
    setPanels((prev) =>
      prev.map((panel) =>
        panel.id === panelId ? { ...panel, provider, modelId: DEFAULT_MODEL[provider] } : panel,
      ),
    );
  }, []);

  const handleModelChange = useCallback((panelId: number, modelId: string) => {
    setPanels((prev) =>
      prev.map((panel) => (panel.id === panelId ? { ...panel, modelId } : panel)),
    );
  }, []);

  const handleRemove = useCallback((panelId: number) => {
    setPanels((prev) => (prev.length > 1 ? prev.filter((panel) => panel.id !== panelId) : prev));
    setStatusMap((prev) => {
      const next = { ...prev };
      delete next[panelId];
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      delete next[panelId];
      return next;
    });
  }, []);

  const handleAddModel = useCallback((provider: ProviderId, modelId: string) => {
    setPanels((prev) =>
      prev.length >= MAX_PANELS
        ? prev
        : [...prev, { id: nextIdRef.current++, provider, modelId }],
    );
  }, []);

  const handleRun = useCallback(() => {
    setRun({
      runId: Date.now(),
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
    });
  }, [prompt, systemPrompt, temperature, maxTokens]);

  const handleStop = useCallback(() => {
    setStopSignal((value) => value + 1);
  }, []);

  if (!isReady) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="animate-spin" />
        <p className="text-sm">Unlocking key vault…</p>
      </Card>
    );
  }

  if (noKeysConfigured) {
    return (
      <Card className="flex min-h-72 flex-col items-center justify-center gap-4 border-dashed p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <KeyRound className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg">No API keys configured yet</CardTitle>
          <CardDescription className="max-w-md">
            Add a key for OpenAI, Anthropic, Gemini, or Groq to start benchmarking
            models head-to-head. Keys stay encrypted in this browser — nothing is
            sent to OmniEval servers.
          </CardDescription>
        </div>
        <KeyVaultDialog trigger={<Button size="lg"><Settings2 /> Configure API keys</Button>} />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ControlBar
        prompt={prompt}
        systemPrompt={systemPrompt}
        temperature={temperature}
        maxTokens={maxTokens}
        panelCount={panels.length}
        isStreaming={anyStreaming}
        canRun={canRun}
        addableOptions={addableOptions}
        onPromptChange={setPrompt}
        onSystemPromptChange={setSystemPrompt}
        onTemperatureChange={setTemperature}
        onMaxTokensChange={setMaxTokens}
        onRun={handleRun}
        onStop={handleStop}
        onAddModel={handleAddModel}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted">
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Results</span>
          <Badge variant="secondary">{panels.length}/{MAX_PANELS}</Badge>
        </div>
        <ExportMenu session={session} disabled={!hasResults} />
      </div>

      <div className={`grid items-start gap-4 ${gridClass(panels.length)}`}>
        {panels.map((panel) => (
          <ModelPanel
            key={panel.id}
            panelId={panel.id}
            provider={panel.provider}
            modelId={panel.modelId}
            run={run}
            stopSignal={stopSignal}
            canRemove={panels.length > 1}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
            onRemove={handleRemove}
            onStatusChange={handleStatusChange}
            onResult={handleResult}
          />
        ))}
      </div>

      <LatencyChart results={results} />
    </div>
  );
}
