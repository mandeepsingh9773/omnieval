"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/arena/types";
import { PROVIDER_METADATA } from "@/lib/byok/providers";
import type { ProviderId } from "@/lib/eval/types";
import { PROVIDER_STYLES } from "./provider-badge";

const RANK_BADGE = [
  "bg-amber-400/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "bg-slate-300/30 text-slate-600 dark:text-slate-300 border-slate-400/30",
  "bg-orange-400/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
];

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

function ProviderLabel({ provider }: { provider: ProviderId | null }) {
  if (!provider) return null;
  const style = PROVIDER_STYLES[provider];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] font-medium whitespace-nowrap",
        style.badge,
      )}
    >
      {PROVIDER_METADATA[provider].label}
    </span>
  );
}

export function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRefresh, setManualRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/arena/leaderboard")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)),
      )
      .then((data) => {
        if (cancelled) return;
        setEntries(Array.isArray(data?.models) ? data.models : []);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load leaderboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, manualRefresh]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-muted-foreground" />
          Leaderboard
          <Badge variant="secondary" className="ml-auto">
            {entries.length} model{entries.length === 1 ? "" : "s"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" />
            Loading rankings…
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-destructive">{error}</p>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <p>No battles recorded yet.</p>
            <p className="text-xs">Run an Arena Mode matchup above to seed the rankings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Rank</th>
                  <th className="px-2 py-2 font-medium">Model</th>
                  <th className="px-2 py-2 text-right font-medium">Elo</th>
                  <th className="px-2 py-2 text-right font-medium">Win rate</th>
                  <th className="px-2 py-2 text-right font-medium">W–L–D</th>
                  <th className="px-2 py-2 text-right font-medium">Battles</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.modelName}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-md border font-mono text-xs font-semibold tabular-nums",
                          RANK_BADGE[index] ?? "text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <ProviderLabel provider={entry.provider} />
                        <span className="truncate font-mono text-xs">{entry.modelId}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right font-mono font-semibold tabular-nums">
                      {entry.rating}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs tabular-nums">
                      {formatWinRate(entry.winRate)}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs tabular-nums">
                      {entry.wins}–{entry.losses}–{entry.draws}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-xs tabular-nums">
                      {entry.matchCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setManualRefresh((n) => n + 1)}
          >
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
