"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gauge, Timer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDER_METADATA } from "@/lib/byok/providers";
import type { ProviderId } from "@/lib/eval/types";
import type { PanelResult } from "./types";

interface ChartPoint {
  /** Short label for the axis — the model id. */
  modelId: string;
  /** Full `provider/model` key used in tooltips and titles. */
  fullName: string;
  provider: ProviderId;
  /** ms until the first output token. */
  ttftMs: number | null;
  /** output tokens per second of generation time. */
  tokensPerSecond: number | null;
}

/** Provider identity color resolved from the `--provider-*` theme tokens. */
function providerColor(provider: ProviderId): string {
  return `var(--provider-${provider})`;
}

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" };

interface SubChartProps {
  title: string;
  subtitle: string;
  icon: typeof Timer;
  data: ChartPoint[];
  dataKey: "ttftMs" | "tokensPerSecond";
  unit: string;
}

function SubChart({ title, subtitle, icon: Icon, data, dataKey, unit }: SubChartProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <div className="flex flex-col">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="modelId"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              unit={unit}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--muted) 40%, transparent)" }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
              labelStyle={{ fontWeight: 600 }}
              formatter={(value, _name, entry) => {
                const point = entry.payload as ChartPoint;
                const providerLabel = PROVIDER_METADATA[point.provider].label;
                return [`${value}${unit}`, `${providerLabel} · ${point.fullName}`];
              }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
              {data.map((point) => (
                <Cell key={point.fullName} fill={providerColor(point.provider)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from(new Set(data.map((point) => point.provider))).map((provider) => (
          <span key={provider} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: providerColor(provider) }}
            />
            {PROVIDER_METADATA[provider].label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Quick latency comparison across the models that have finished a run.
 * Two side-by-side bar charts (TTFT and tokens/sec) keep each axis legible
 * instead of cramming two differently-scaled metrics onto one.
 */
export function LatencyChart({ results }: { results: Record<number, PanelResult> }) {
  const points = useMemo<ChartPoint[]>(() => {
    return Object.values(results)
      .filter((result) => result.metrics)
      .map((result) => ({
        modelId: result.modelId,
        fullName: `${result.provider}/${result.modelId}`,
        provider: result.provider,
        ttftMs: result.metrics?.ttftMs ?? result.clientTTFTMs ?? null,
        tokensPerSecond: result.metrics?.tokensPerSecond ?? null,
      }))
      .sort((a, b) => (a.ttftMs ?? Number.MAX_SAFE_INTEGER) - (b.ttftMs ?? Number.MAX_SAFE_INTEGER));
  }, [results]);

  const hasTTFT = points.some((point) => point.ttftMs !== null);
  const hasSpeed = points.some((point) => point.tokensPerSecond !== null);

  if (points.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="size-4 text-muted-foreground" />
          Latency comparison
        </CardTitle>
        <CardDescription>
          Time to first token and generation speed for the latest run of each model.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasTTFT && !hasSpeed ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Run at least one model to see the comparison chart.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {hasTTFT && (
              <SubChart
                title="Time to first token"
                subtitle="Lower is better"
                icon={Timer}
                data={points}
                dataKey="ttftMs"
                unit=" ms"
              />
            )}
            {hasSpeed && (
              <SubChart
                title="Generation speed"
                subtitle="Higher is better"
                icon={Gauge}
                data={points}
                dataKey="tokensPerSecond"
                unit=" tok/s"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
