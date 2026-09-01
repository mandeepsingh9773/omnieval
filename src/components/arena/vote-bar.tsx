"use client";

import {
  ArrowBigLeft,
  ArrowBigRight,
  Scale,
  ThumbsDown,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoteResult } from "@/lib/arena/elo";

const OPTIONS: ReadonlyArray<{ value: VoteResult; icon: LucideIcon; label: string }> = [
  { value: "MODEL_A", icon: ArrowBigLeft, label: "Model A is Better" },
  { value: "MODEL_B", icon: ArrowBigRight, label: "Model B is Better" },
  { value: "TIE", icon: Scale, label: "Tie" },
  { value: "BOTH_BAD", icon: ThumbsDown, label: "Both are Bad" },
];

export function VoteBar({
  onVote,
  disabled,
}: {
  onVote: (result: VoteResult) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={disabled}
            onClick={() => onVote(option.value)}
          >
            <Icon className="size-4" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
