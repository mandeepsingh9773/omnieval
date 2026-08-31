"use client";

import { Button } from "@/components/ui/button";
import type { VoteResult } from "@/lib/arena/elo";

const OPTIONS: ReadonlyArray<{ value: VoteResult; emoji: string; label: string }> = [
  { value: "MODEL_A", emoji: "👈", label: "Model A is Better" },
  { value: "MODEL_B", emoji: "👉", label: "Model B is Better" },
  { value: "TIE", emoji: "🤝", label: "Tie" },
  { value: "BOTH_BAD", emoji: "❌", label: "Both are Bad" },
];

export function VoteBar({
  onVote,
  disabled,
}: {
  onVote: (result: VoteResult) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onVote(option.value)}
          title={`Vote: ${option.label}`}
        >
          <span aria-hidden>{option.emoji}</span>
          {option.label}
        </Button>
      ))}
    </div>
  );
}
