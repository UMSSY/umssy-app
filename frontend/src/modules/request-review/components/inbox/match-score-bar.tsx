import { cn } from "cn";
import { AUTO_APPROVAL_THRESHOLD, LOW_MATCH_THRESHOLD, NOT_VALIDATED_LABEL } from "../../constants/automatic-validation.constants";
import type { MatchScoreBarProps } from "../../types/automatic-validation-props.types";

function barColor(score: number) {
  if (score >= AUTO_APPROVAL_THRESHOLD) return "bg-ink";
  if (score < LOW_MATCH_THRESHOLD) return "bg-danger";
  return "bg-gold";
}

export function MatchScoreBar({ validation }: MatchScoreBarProps) {
  const score = validation?.matchScore;
  if (score === null || score === undefined) {
    return <span className="text-sm text-text-secondary">{NOT_VALIDATED_LABEL}</span>;
  }
  return (
    <div className="flex items-center gap-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={`Coincidencia ${score}%`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-soft" aria-hidden="true">
        <span className={cn("block h-full rounded-full", barColor(score))} style={{ width: `${score}%` }} />
      </span>
      <span className="text-sm font-semibold text-ink tabular-nums">{score}%</span>
    </div>
  );
}
