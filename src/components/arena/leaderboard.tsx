"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/arena/types";
import { ProviderBadge } from "./provider-badge";

const RANK_BADGE = [
  "border-status-warning/50 bg-status-warning/20 text-status-warning",
  "border-border bg-muted/50 text-muted-foreground",
  "border-status-warning/30 bg-status-warning/10 text-status-warning/80",
];

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
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
          <div className="flex size-7 items-center justify-center rounded-md bg-muted">
            <Trophy className="size-4 text-muted-foreground" />
          </div>
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
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Rank</th>
                  <th className="px-3 py-2.5 font-medium">Model</th>
                  <th className="px-3 py-2.5 text-right font-medium">Elo</th>
                  <th className="px-3 py-2.5 text-right font-medium">Win rate</th>
                  <th className="px-3 py-2.5 text-right font-medium">W–L–D</th>
                  <th className="px-3 py-2.5 text-right font-medium">Battles</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.modelName}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/60"
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-md border font-mono text-xs font-semibold tabular-nums",
                          RANK_BADGE[index] ?? "text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        {entry.provider && <ProviderBadge provider={entry.provider} />}
                        <span className="truncate font-mono text-xs">{entry.modelId}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                      {entry.rating}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                      {formatWinRate(entry.winRate)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                      {entry.wins}–{entry.losses}–{entry.draws}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
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
