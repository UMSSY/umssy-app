"use client";

import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_ANALYTICS_MESSAGES } from "../constants/survey-analytics.constants";
import { ALL_CAREERS_LABEL } from "../constants/survey-form.constants";
import { SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { SurveyMetricsGrid } from "../components/survey-metrics-grid";
import { SurveyQuestionResultCard } from "../components/survey-question-result-card";
import { useSurveyAnalytics } from "../hooks/use-survey-analytics";
import type { SurveyAnalyticsViewProps } from "../types/survey-analytics-view-props.types";

const BACK_LINK_CLASSES = cn(buttonVariants({ variant: "ghost" }), "w-fit gap-2 px-2 text-ink-soft");

export function SurveyAnalyticsView({ id }: SurveyAnalyticsViewProps) {
  const { metrics, statistics, isLoading, isUnavailable, isError, refresh } = useSurveyAnalytics(id);
  const survey = statistics?.survey;
  const description = survey
    ? `${survey.period} · ${survey.targetCareer ?? ALL_CAREERS_LABEL} · ${statistics.questions.length} preguntas`
    : "Métricas de participación y resultados de cada pregunta.";

  const renderQuestions = () => {
    if (isUnavailable) return <p role="status" className="text-sm text-text-secondary">{SURVEY_ANALYTICS_MESSAGES.noStatistics}</p>;
    if (isError) return <p role="alert" className="text-sm text-destructive">{SURVEY_ANALYTICS_MESSAGES.loadError}</p>;
    if (!statistics) {
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      );
    }

    return (
      <>
        {statistics.totalResponses === 0 && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-border bg-surface-soft p-4 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {SURVEY_ANALYTICS_MESSAGES.noResponses}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statistics.questions.map((question) => (
            <SurveyQuestionResultCard key={question.id} question={question} />
          ))}
        </div>
      </>
    );
  };

  return (
    <WorkspacePage
      title={survey ? `Analíticas: ${survey.title}` : "Analíticas de la encuesta"}
      description={description}
      actions={<RefreshButton label="Actualizar" onClick={refresh} isRefreshing={isLoading} />}
    >
      <Link href={SURVEYS_BASE_PATH} className={BACK_LINK_CLASSES}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al historial
      </Link>

      <SurveyMetricsGrid metrics={metrics} isLoading={isLoading && !metrics} />

      <section aria-label="Resultados por pregunta" className="flex flex-col gap-4">
        <h2 className="font-tight text-xl font-bold text-ink">Resultados por pregunta</h2>
        {renderQuestions()}
      </section>
    </WorkspacePage>
  );
}
