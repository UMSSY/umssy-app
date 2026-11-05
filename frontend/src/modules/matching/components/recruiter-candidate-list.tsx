"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getInitials } from "@/shared/utils/get-initials";
import type { RecruiterApplicant } from "../types/radar-recruiter.types";

interface RecruiterCandidateListProps {
  query: string;
  onQueryChange: (query: string) => void;
  candidates: RecruiterApplicant[];
  selectedApplicationId: string | null;
  onSelectCandidate: (applicationId: string) => void;
}

function matchLabel(candidate: RecruiterApplicant) {
  return candidate.comparison ? `${candidate.comparison.match}%` : "Sin radar";
}

export function RecruiterCandidateList({
  query,
  onQueryChange,
  candidates,
  selectedApplicationId,
  onSelectCandidate,
}: RecruiterCandidateListProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Input
        type="search"
        placeholder="Buscar candidato"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Buscar candidato"
      />

      <p className="text-xs text-muted-foreground">
        {candidates.length} candidato{candidates.length === 1 ? "" : "s"} · ordenados por
        compatibilidad
      </p>

      {candidates.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {query
            ? `No se encontraron candidatos para "${query}".`
            : "No hay postulantes con radar publicado y consentimiento de visibilidad."}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {candidates.map((candidate) => {
            const selected = candidate.applicationId === selectedApplicationId;
            return (
              <button
                key={candidate.applicationId}
                type="button"
                onClick={() => onSelectCandidate(candidate.applicationId)}
                aria-pressed={selected}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-muted"
                    : "border-border bg-background hover:bg-muted/60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {getInitials(candidate.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {candidate.name}
                      </p>
                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {matchLabel(candidate)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {candidate.headline || "Perfil sin presentación"}
                    </p>

                    {candidate.comparison && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${candidate.comparison.match}%` }}
                        />
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 4).map((technology) => (
                        <span
                          key={technology}
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {technology}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
