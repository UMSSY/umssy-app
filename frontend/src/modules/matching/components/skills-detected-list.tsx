"use client";

import { Badge } from "@/components/ui/badge";
import { formatAnalysisTime } from "../utils/format-analysis-time";

interface SkillsDetectedListProps {
  skills: string[];
  processingTimeMs?: number;
}

export function SkillsDetectedList({ skills, processingTimeMs }: SkillsDetectedListProps) {
  if (skills.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-lg font-bold text-ink">Habilidades detectadas automáticamente</h3>
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li key={skill}>
            <Badge variant="secondary">{skill}</Badge>
          </li>
        ))}
      </ul>
      {processingTimeMs !== undefined && (
        <p className="text-xs font-semibold text-text-secondary">
          {formatAnalysisTime(processingTimeMs)}
        </p>
      )}
    </section>
  );
}
