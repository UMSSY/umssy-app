type MatchScoreBarProps = ({ value: number; score?: never } | { score: number; value?: never }) & {
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function MatchScoreBar({ value, score: suppliedScore, showLabel = true, size = "md", className = "" }: MatchScoreBarProps) {
  const raw = value ?? suppliedScore ?? 0;
  const score = Number.isFinite(raw) ? Math.max(0, Math.min(100, Math.round(raw))) : 0;
  const heights = { sm: "h-2", md: "h-3", lg: "h-4" };
  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel ? <div className="flex justify-between gap-3 text-sm font-medium"><span>Compatibilidad</span><span>{score}%</span></div> : null}
      <div role="progressbar" aria-label="Compatibilidad" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} className={`overflow-hidden rounded-full bg-muted ${heights[size]}`}>
        <div className="h-full bg-accent transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
