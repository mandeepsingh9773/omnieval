import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { PanelStatus } from "./types";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const STATUS_META: Record<
  PanelStatus,
  { variant: BadgeVariant; label: string; pulse?: boolean }
> = {
  idle: { variant: "outline", label: "Idle" },
  streaming: { variant: "streaming", label: "Streaming", pulse: true },
  completed: { variant: "success", label: "Completed" },
  error: { variant: "error", label: "Error" },
};

export function StatusBadge({ status }: { status: PanelStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className="gap-1.5">
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-current",
          meta.pulse && "animate-pulse",
        )}
      />
      {meta.label}
    </Badge>
  );
}
