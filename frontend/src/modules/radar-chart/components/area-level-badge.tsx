import type { AreaLevelBadgeProps } from "../types/area-detail-components.types";
import type { AreaLevel } from "../types/area-detail.types";

const LEVEL_MARKS: Record<AreaLevel, number> = {
  Bajo: 1,
  Medio: 2,
  Alto: 3,
  Experto: 4,
};

export function AreaLevelBadge({ level }: AreaLevelBadgeProps) {
  const activeMarks = LEVEL_MARKS[level];

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="font-semibold text-ink">{level}</span>
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => {
          const isActive = index < activeMarks;
          const isExpert = level === "Experto" && isActive;
          return (
            <span
              key={index}
              className={
                isExpert
                  ? "size-1.5 rounded-full bg-accent"
                  : isActive
                    ? "size-1.5 rounded-full bg-ink"
                    : "size-1.5 rounded-full bg-border-strong"
              }
            />
          );
        })}
      </span>
    </span>
  );
}
