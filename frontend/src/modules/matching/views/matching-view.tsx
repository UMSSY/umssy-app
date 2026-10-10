"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/components/layout";
import { useMatching } from "../hooks/use-matching";
import { VacancyTabs } from "../components/vacancy-tabs";
import { CandidateList } from "../components/candidate-list";
import { CandidateDetailPanel } from "../components/candidate-detail-panel";

export function MatchingView() {
  const {
    axes,
    vacancies,
    vacancy,
    vacancyId,
    selectVacancy,
    query,
    setQuery,
    candidates,
    selectedCandidate,
    selectCandidate,
    pendingDiscardId,
    requestDiscard,
    confirmDiscard,
    cancelDiscard,
    confirmSchedule,
    actionFeedback,
  } = useMatching();

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Reclutamiento" },
          { label: "Radar Charts" },
        ]}
        title="Buscar candidatos por afinidad"
        actions={
          <VacancyTabs
            vacancies={vacancies}
            activeVacancyId={vacancyId}
            onChange={selectVacancy}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 py-6">
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="flex min-h-[420px] flex-col lg:h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {vacancy ? `Candidatos · ${vacancy.title}` : "Candidatos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <CandidateList
                query={query}
                onQueryChange={setQuery}
                candidates={candidates}
                selectedCandidateId={selectedCandidate?.id ?? null}
                onSelectCandidate={selectCandidate}
              />
            </CardContent>
          </Card>

          <div className="min-h-[420px] lg:h-full">
            <CandidateDetailPanel
              candidate={selectedCandidate}
              vacancy={vacancy}
              axes={axes}
              pendingDiscardId={pendingDiscardId}
              onRequestDiscard={requestDiscard}
              onConfirmDiscard={confirmDiscard}
              onCancelDiscard={cancelDiscard}
              onConfirmSchedule={confirmSchedule}
              actionFeedback={actionFeedback}
            />
          </div>
        </div>
      </div>
    </>
  );
}
