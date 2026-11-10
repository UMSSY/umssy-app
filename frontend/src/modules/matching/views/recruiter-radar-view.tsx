"use client";

import { useMemo, useState } from "react";
import { PageHeading } from "@/shared/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useRecruiterApplicants,
  useRecruiterVacancies,
} from "../hooks/use-radar-recruiter";
import {
  RADAR_AXES,
  type RecruiterApplicant,
} from "../types/radar-recruiter.types";
import { RecruiterCandidateList } from "../components/recruiter-candidate-list";
import { RecruiterCandidatePanel } from "../components/recruiter-candidate-panel";
import { VacancyTabs } from "../components/vacancy-tabs";

function filterByName(candidates: RecruiterApplicant[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return candidates;

  return candidates.filter((candidate) =>
    candidate.name.toLocaleLowerCase().includes(normalized),
  );
}

export function RecruiterRadarView() {
  const vacanciesQuery = useRecruiterVacancies();
  const vacancies = vacanciesQuery.data ?? [];
  const [vacancyId, setVacancyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const activeVacancy =
    vacancies.find((vacancy) => vacancy.id === vacancyId) ?? vacancies[0] ?? null;

  const applicantsQuery = useRecruiterApplicants(activeVacancy?.id ?? "");
  const target = applicantsQuery.data?.vacancy ?? null;

  const filteredCandidates = useMemo(
    () => filterByName(applicantsQuery.data?.applicants ?? [], query),
    [applicantsQuery.data, query],
  );
  const selectedCandidate =
    filteredCandidates.find(
      (candidate) => candidate.applicationId === selectedApplicationId,
    ) ??
    filteredCandidates[0] ??
    null;

  function selectVacancy(id: string) {
    setVacancyId(id);
    setQuery("");
    setSelectedApplicationId(null);
  }

  function renderVacancies() {
    if (vacanciesQuery.isPending) {
      return (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Cargando vacantes publicadas...
          </CardContent>
        </Card>
      );
    }

    if (vacanciesQuery.isError) {
      return (
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              No se pudieron cargar las vacantes publicadas.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => void vacanciesQuery.refetch()}
            >
              Reintentar vacantes
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (vacancies.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No hay vacantes publicadas en las empresas vinculadas a tu sesión.
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <VacancyTabs
          vacancies={vacancies}
          activeVacancyId={activeVacancy?.id ?? ""}
          onChange={selectVacancy}
        />

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="flex min-h-[420px] flex-col lg:h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {target ? `Candidatos · ${target.title}` : "Candidatos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {applicantsQuery.isPending ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Cargando postulantes...
                </p>
              ) : applicantsQuery.isError ? (
                <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p role="alert" className="text-sm text-destructive">
                    No se pudieron cargar los postulantes de esta vacante.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => void applicantsQuery.refetch()}
                  >
                    Reintentar candidatos
                  </Button>
                </div>
              ) : (
                <RecruiterCandidateList
                  query={query}
                  onQueryChange={setQuery}
                  candidates={filteredCandidates}
                  selectedApplicationId={selectedCandidate?.applicationId ?? null}
                  onSelectCandidate={setSelectedApplicationId}
                />
              )}
            </CardContent>
          </Card>

          <div className="min-h-[420px] lg:h-full">
            <RecruiterCandidatePanel
              key={`${activeVacancy?.id ?? "none"}:${selectedCandidate?.applicationId ?? "none"}`}
              candidate={selectedCandidate}
              vacancy={target}
              axes={RADAR_AXES}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="mx-auto flex size-full max-w-7xl flex-col gap-6">
      <PageHeading
        title="Buscar candidatos"
        description="Compara la afinidad de los postulantes con el perfil de cada vacante publicada por tu empresa."
      />

      {renderVacancies()}
    </main>
  );
}
