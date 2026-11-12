"use client";

import type { RecruiterCandidateListProps } from "../types/recruiter-candidate-list-props.types";
import { CandidateList } from "./candidate-list";

export function RecruiterCandidateList({
  query,
  onQueryChange,
  candidates,
  selectedApplicationId,
  onSelectCandidate,
}: RecruiterCandidateListProps) {
  return (
    <CandidateList
      query={query}
      onQueryChange={onQueryChange}
      candidates={candidates.map((candidate) => ({
        id: candidate.applicationId,
        name: candidate.name,
        role: candidate.headline || "Perfil sin presentación",
        matchPercent: candidate.comparison.match,
        technologies: candidate.skills.slice(0, 4),
      }))}
      selectedCandidateId={selectedApplicationId}
      onSelectCandidate={onSelectCandidate}
      emptyMessage={
        query
          ? undefined
          : "No hay postulantes con radar publicado y consentimiento de visibilidad."
      }
    />
  );
}
