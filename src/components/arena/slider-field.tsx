import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

/** Labeled slider with a mono value readout. Shared by the arena control bars. */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      />
    </div>
  );
}
