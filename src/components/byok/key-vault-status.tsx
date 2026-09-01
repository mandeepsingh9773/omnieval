"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useKeyVault } from "@/lib/byok/key-vault";
import { PROVIDER_LIST } from "@/lib/byok/providers";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

/** Read-only snapshot of which BYOK providers are configured in this browser. */
export function KeyVaultStatus() {
  const { keys, isReady } = useKeyVault();

  if (!isReady) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Unlocking vault…
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {PROVIDER_LIST.map((meta) => {
        const configured = Boolean(keys[meta.id]);
        return (
          <li
            key={meta.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2",
              configured ? "border-status-success/25" : "border-border",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: `var(--provider-${meta.id})` }}
              />
              <span className="truncate text-sm font-medium">{meta.label}</span>
            </span>
            {configured ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" />
                Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Circle />
                Not configured
              </Badge>
            )}
          </li>
        );
      })}
    </ul>
  );
}
