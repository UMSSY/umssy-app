"use client";

import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DETECTED_SKILLS_TEXTS } from "../constants/skills.constants";
import { useDetectedSkills } from "../hooks/use-detected-skills";
import type { DetectedSkillsSummary } from "../types/detected-skills-summary.types";

function getStatusMessage(summary: DetectedSkillsSummary | null, hasLoadError: boolean, isLoading: boolean) {
  if (isLoading) return DETECTED_SKILLS_TEXTS.loading;
  if (hasLoadError || !summary) return DETECTED_SKILLS_TEXTS.loadError;
  if (summary.status === "pending") return DETECTED_SKILLS_TEXTS.pending;
  if (summary.status === "error") return DETECTED_SKILLS_TEXTS.error;
  return summary.skills.length ? null : DETECTED_SKILLS_TEXTS.empty;
}

export function DetectedSkillsPanel() {
  const detected = useDetectedSkills();
  const message = getStatusMessage(detected.summary, detected.hasLoadError, detected.isLoading);

  return (
    <div role="group" className="mt-6 border-t border-border pt-5" aria-labelledby="detected-skills-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose min-w-0">
          <h3 id="detected-skills-title" className="text-sm font-semibold text-ink">{DETECTED_SKILLS_TEXTS.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{DETECTED_SKILLS_TEXTS.description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={detected.isLoading || detected.isAnalyzing}
          onClick={detected.analyze}
        >
          <RefreshCw aria-hidden="true" />
          {detected.isAnalyzing ? DETECTED_SKILLS_TEXTS.analyzing : DETECTED_SKILLS_TEXTS.analyze}
        </Button>
      </div>
      {message ? (
        <p role="status" className="mt-3 text-sm text-text-secondary">{message}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={DETECTED_SKILLS_TEXTS.title}>
          {detected.summary?.skills.map((skill) => (
            <li key={skill.id}>
              <Badge variant="outline" className="h-auto gap-2 px-3 py-1.5 text-sm" title={DETECTED_SKILLS_TEXTS.evidence(skill.evidenceCount)}>
                <span className="font-semibold text-ink">{skill.name}</span>
                <span className="text-xs text-text-secondary">{DETECTED_SKILLS_TEXTS.evidence(skill.evidenceCount)}</span>
                <span className="text-xs text-text-secondary">{skill.verificationStatus === 'approved' ? 'Aprobada' : skill.verificationStatus === 'rejected' ? 'Rechazada' : skill.verificationStatus === 'revoked' ? 'Revocada' : 'Pendiente de revisión'}</span>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
