import type { LucideIcon } from "lucide-react";

export interface MetricChipProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Compact inline metric readout (TTFT, tokens, cost, …). */
export function MetricChip({ icon: Icon, label, value }: MetricChipProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1">
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-[0.65rem] font-medium text-muted-foreground uppercase">
        {label}
      </span>
      <span className="min-w-0 truncate font-mono text-xs font-medium tabular-nums">{value}</span>
    </div>
  );
}
