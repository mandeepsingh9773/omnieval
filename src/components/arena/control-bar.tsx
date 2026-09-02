"use client";

import type { KeyboardEvent } from "react";
import { ChevronDown, Plus, Square, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROVIDER_METADATA } from "@/lib/byok/providers";
import { MAX_PANELS } from "@/lib/eval/models";
import type { ProviderId } from "@/lib/eval/types";
import { ProviderDot } from "./provider-badge";
import { SliderField } from "./slider-field";

export interface AddableModel {
  provider: ProviderId;
  modelId: string;
}

export interface ControlBarProps {
  prompt: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  panelCount: number;
  isStreaming: boolean;
  canRun: boolean;
  addableOptions: AddableModel[];
  onPromptChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onRun: () => void;
  onStop: () => void;
  onAddModel: (provider: ProviderId, modelId: string) => void;
}

export function ControlBar(props: ControlBarProps) {
  const {
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
    panelCount,
    isStreaming,
    canRun,
    addableOptions,
    onPromptChange,
    onSystemPromptChange,
    onTemperatureChange,
    onMaxTokensChange,
    onRun,
    onStop,
    onAddModel,
  } = props;

  function handleShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
    }
  }

  const atMaxPanels = panelCount >= MAX_PANELS;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="arena-prompt">Prompt</Label>
          <Textarea
            id="arena-prompt"
            value={prompt}
            rows={5}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={handleShortcut}
            placeholder="Ask the models anything…"
          />
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded border bg-muted px-1 font-mono">⌘/Ctrl</kbd> +{" "}
            <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to run
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="arena-system">System prompt (optional)</Label>
          <Textarea
            id="arena-system"
            value={systemPrompt}
            rows={5}
            onChange={(event) => onSystemPromptChange(event.target.value)}
            onKeyDown={handleShortcut}
            placeholder="You are a precise, terse assistant."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SliderField
          label="Temperature"
          value={temperature}
          min={0}
          max={2}
          step={0.05}
          display={temperature.toFixed(2)}
          onChange={onTemperatureChange}
        />
        <SliderField
          label="Max tokens"
          value={maxTokens}
          min={128}
          max={8192}
          step={64}
          display={maxTokens.toLocaleString()}
          onChange={onMaxTokensChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={!canRun} onClick={onRun}>
          <Sparkles />
          Run all models
        </Button>
        {isStreaming && (
          <Button size="sm" variant="outline" onClick={onStop}>
            <Square /> Stop
          </Button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={atMaxPanels}>
                <Plus />
                Add model
                <Badge variant="secondary" className="ml-1">
                  {panelCount}/{MAX_PANELS}
                </Badge>
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
              <DropdownMenuLabel>Available models</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {addableOptions.length === 0 ? (
                <DropdownMenuItem disabled className="justify-center text-muted-foreground">
                  All models added
                </DropdownMenuItem>
              ) : (
                addableOptions.map((option) => (
                  <DropdownMenuItem
                    key={`${option.provider}:${option.modelId}`}
                    onSelect={() => onAddModel(option.provider, option.modelId)}
                  >
                    <ProviderDot provider={option.provider} />
                    <span className="min-w-0">
                      <span className="font-medium">
                        {PROVIDER_METADATA[option.provider].label}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {option.modelId}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
