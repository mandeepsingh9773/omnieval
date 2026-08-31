"use client";

import { Badge } from "@/components/ui/badge";
import { useKeyVault } from "@/lib/byok/key-vault";
import { PROVIDER_LIST } from "@/lib/byok/providers";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

/** Read-only snapshot of which BYOK providers are configured in this browser. */
export function KeyVaultStatus() {
  const { keys, isReady } = useKeyVault();

  if (!isReady) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" />
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
            className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
          >
            <span className="text-sm font-medium">{meta.label}</span>
            {configured ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
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
